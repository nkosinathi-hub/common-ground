import { describe, expect, it } from "vitest"
import { createAttachmentsHandler } from "./handler.ts"
import { MemoryStorage, MemoryStore } from "./memory-fakes.ts"
import { IDEA, SPACE, memoryGate } from "./samples.ts"

const ORIGIN = "http://127.0.0.1:5173"
const SECRET = "c".repeat(48)
const UNKNOWN_ATTACHMENT = "2b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f62"
const ANA = { authorization: "Bearer ana-token" }
const start = {
  action: "start",
  spaceId: SPACE,
  ideaId: IDEA,
  filename: "a.png",
  mime: "image/png",
  bytes: 9,
}
const cleanup = { action: "cleanup" }

function setup() {
  const store = new MemoryStore()
  const storage = new MemoryStorage()
  store.ideas.add(`${SPACE}/${IDEA}`)
  const gate = memoryGate()
  const deps = { allowedOrigins: [ORIGIN], cleanupSecret: SECRET, gate, store, storage }
  const handle = createAttachmentsHandler(deps)
  const call = (body: unknown, headers: Record<string, string> = { origin: ORIGIN, ...ANA }) =>
    handle(
      new Request("http://fn.test/attachments", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }),
    )
  return { call, store, storage, gate }
}

const kindOf = async (response: Response) =>
  ((await response.json()) as { error: { kind: string } }).error.kind

describe("attachments handler, user actions", () => {
  it("starts an upload for a member with CORS for the allowed origin", async () => {
    const response = await setup().call(start)
    expect(response.status).toBe(200)
    expect(response.headers.get("access-control-allow-origin")).toBe(ORIGIN)
    expect(await response.json()).toMatchObject({ attachmentId: expect.any(String) })
  })

  it("verifies the JWT itself, since the gateway does not (verify_jwt = false)", async () => {
    const { call } = setup()
    const forged = await call(start, { origin: ORIGIN, authorization: "Bearer forged" })
    expect(forged.status).toBe(401)
    expect(await kindOf(forged)).toBe("unauthenticated")
    expect((await call(start, { origin: ORIGIN })).status).toBe(401)
  })

  it("refuses a user action without an allowed Origin, even with a valid JWT", async () => {
    const { call, store } = setup()
    expect((await call(start, ANA)).status).toBe(403)
    expect((await call(start, { origin: "https://evil.example", ...ANA })).status).toBe(403)
    expect(store.rows.size).toBe(0)
  })

  it("routes each action: a malformed start is 400, an unknown attachment 404", async () => {
    const { call } = setup()
    expect(await kindOf(await call({ action: "start" }))).toBe("validation")
    expect((await call({ action: "finalize", attachmentId: UNKNOWN_ATTACHMENT })).status).toBe(404)
    expect((await call({ action: "download", attachmentId: UNKNOWN_ATTACHMENT })).status).toBe(404)
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

describe("attachments handler, scheduled cleanup", () => {
  it("runs with the secret alone: no JWT and no Origin, as CI calls it", async () => {
    const { call, store, storage } = setup()
    store.candidates = [{ attachmentId: null, objectPath: "s/i/u" }]
    const response = await call(cleanup, { "x-cleanup-secret": SECRET })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ removedObjects: 1, deletedRows: 0, failedBatches: 0 })
    expect(storage.removed).toEqual(["s/i/u"])
  })

  it("never runs on a user JWT or a wrong secret", async () => {
    const { call, storage } = setup()
    expect((await call(cleanup)).status).toBe(403)
    expect((await call(cleanup, { "x-cleanup-secret": "nope" })).status).toBe(403)
    expect(storage.removed).toEqual([])
  })
})
