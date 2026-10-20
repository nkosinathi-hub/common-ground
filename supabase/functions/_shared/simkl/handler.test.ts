import { describe, expect, it, vi } from "vitest"
import type { Gate } from "../http/gate.ts"
import { RATE_LIMIT, createSimklHandler } from "./handler.ts"
import type { SimklService } from "./service.ts"

const origin = "http://127.0.0.1:5173"

function setup(clientId = "cid", overrides: Partial<Gate> = {}) {
  const counts = new Map<string, number>()
  const gate: Gate = {
    userFor: async (token) => (token === "good" ? "user-1" : null),
    isMember: async () => true,
    consume: async (user) => {
      counts.set(user, (counts.get(user) ?? 0) + 1)
      return (counts.get(user) ?? 0) <= RATE_LIMIT.max
    },
    ...overrides,
  }
  const done = { ok: true as const, body: { done: true } }
  const spies = {
    pin: vi.fn(async () => done),
    poll: vi.fn(async () => done),
    sync: vi.fn(async () => done),
    disconnect: vi.fn(async () => done),
  }
  const service = spies as unknown as SimklService
  const handle = createSimklHandler({ allowedOrigins: [origin], gate, clientId, service })
  const call = (body: unknown, token = "good", from: string | null = origin) =>
    handle(
      new Request("http://fn.test/simkl", {
        method: "POST",
        headers: { ...(from ? { origin: from } : {}), authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      }),
    )
  return { call, service: spies }
}

const errorOf = async (response: Response) =>
  ((await response.json()) as { error: { kind: string; message: string } }).error

describe("simkl handler", () => {
  it("runs each action for the signed-in caller", async () => {
    const { call, service } = setup()
    for (const action of ["pin", "sync", "disconnect"])
      expect((await call({ action })).status).toBe(200)
    expect((await call({ action: "poll", interval: 10 })).status).toBe(200)
    expect(service.poll).toHaveBeenCalledWith("user-1", 10)
    expect(service.pin).toHaveBeenCalledWith("user-1")
    expect(service.sync).toHaveBeenCalledWith("user-1")
    expect(service.disconnect).toHaveBeenCalledWith("user-1")
  })

  it("says plainly when no Simkl client id is configured", async () => {
    const { call, service } = setup("")
    const response = await call({ action: "pin" })
    expect(response.status).toBe(503)
    expect((await errorOf(response)).message).toMatch(/not set up/)
    expect(service.pin).not.toHaveBeenCalled()
  })

  it("needs a valid JWT and an allowed origin", async () => {
    const { call, service } = setup()
    expect((await call({ action: "sync" }, "forged")).status).toBe(401)
    expect((await call({ action: "sync" }, "good", "https://evil.example")).status).toBe(403)
    expect((await call({ action: "sync" }, "good", null)).status).toBe(403)
    expect(service.sync).not.toHaveBeenCalled()
  })

  it("refuses unknown actions and malformed codes", async () => {
    const { call } = setup()
    expect((await call({ action: "drop" })).status).toBe(400)
    expect((await call({ action: "poll", interval: "5" })).status).toBe(400)
    expect((await call({ action: "poll", interval: 0 })).status).toBe(400)
    expect((await call(null)).status).toBe(400)
  })

  it("rate limits through the shared gate", async () => {
    const { call } = setup()
    for (let i = 0; i < RATE_LIMIT.max; i++) await call({ action: "sync" })
    const limited = await call({ action: "sync" })
    expect(limited.status).toBe(429)
    expect((await errorOf(limited)).kind).toBe("rate_limited")
  })
})
