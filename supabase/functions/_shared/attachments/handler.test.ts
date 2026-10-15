import { describe, expect, it } from "vitest"
import { createAttachmentsHandler } from "./handler.ts"
import { MemoryStorage, MemoryStore } from "./memory-fakes.ts"
import { IDEA, SPACE, memoryGate } from "./samples.ts"

const origin = "http://127.0.0.1:5173"
const secret = "c".repeat(48)
const start = {
  action: "start",
  spaceId: SPACE,
  ideaId: IDEA,
  filename: "a.png",
  mime: "image/png",
  bytes: 9,
}

function setup() {
  const store = new MemoryStore()
  const storage = new MemoryStorage()
  store.ideas.add(`${SPACE}/${IDEA}`)
  const gate = memoryGate()
  const handle = createAttachmentsHandler({
    allowedOrigins: [origin],
    cleanupSecret: secret,
    gate,
    store,
    storage,
  })
  const call = (body: unknown, init: { headers?: Record<string, string>; method?: string } = {}) =>
    handle(
      new Request("http://fn.test/attachments", {
        method: init.method ?? "POST",
        headers: { origin, authorization: "Bearer ana-token", ...init.headers },
        body: (init.method ?? "POST") === "POST" ? JSON.stringify(body) : null,
      }),
    )
  return { call, store, storage, gate }
}

const kindOf = async (response: Response) =>
  ((await response.json()) as { error: { kind: string } }).error.kind

describe("attachments handler", () => {
  it("starts an upload for a member with CORS for the allowed origin", async () => {
    const response = await setup().call(start)
    expect(response.status).toBe(200)
    expect(response.headers.get("access-control-allow-origin")).toBe(origin)
    expect(await response.json()).toMatchObject({ attachmentId: expect.any(String) })
  })

  it("answers preflight, rejects other origins and non-POST methods", async () => {
    const { call } = setup()
    expect((await call(null, { method: "OPTIONS" })).status).toBe(204)
    expect((await call(start, { headers: { origin: "https://evil.example" } })).status).toBe(403)
    expect((await call(null, { method: "GET" })).status).toBe(400)
  })

  it("requires a valid JWT before anything else", async () => {
    const response = await setup().call(start, { headers: { authorization: "Bearer forged" } })
    expect(response.status).toBe(401)
    expect(await kindOf(response)).toBe("unauthenticated")
  })

  it("validates the body", async () => {
    const response = await setup().call({ action: "start" })
    expect(response.status).toBe(400)
  })

  it("routes finalize and download", async () => {
    const { call } = setup()
    const attachmentId = "2b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f62"
    expect((await call({ action: "finalize", attachmentId })).status).toBe(404)
    expect((await call({ action: "download", attachmentId })).status).toBe(404)
  })

  it("runs cleanup only with the cleanup secret, never with a user JWT", async () => {
    const { call, store, storage } = setup()
    store.candidates = [{ attachmentId: null, objectPath: "s/i/u" }]
    expect((await call({ action: "cleanup" })).status).toBe(403)
    const wrong = await call({ action: "cleanup" }, { headers: { "x-cleanup-secret": "nope" } })
    expect(wrong.status).toBe(403)
    const response = await call({ action: "cleanup" }, { headers: { "x-cleanup-secret": secret } })
    expect(await response.json()).toEqual({ removedObjects: 1, deletedRows: 0, failedBatches: 0 })
    expect(storage.removed).toEqual(["s/i/u"])
  })

  it("hides internal failures behind 503", async () => {
    const { call, gate } = setup()
    gate.isMember = async () => {
      throw new Error("connection refused at db:5432")
    }
    const response = await call(start)
    expect(response.status).toBe(503)
    expect(JSON.stringify(await response.json())).not.toMatch(/5432/)
  })
})
