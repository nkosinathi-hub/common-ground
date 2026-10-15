import { describe, expect, it, vi } from "vitest"
import type { Gate } from "../http/gate.ts"
import { RATE_LIMIT, createCatalogHandler } from "./handler.ts"
import { MemoryCache } from "./memory-cache.ts"
import { createCatalogService } from "./service.ts"

const origin = "http://127.0.0.1:5173"
const spaceId = "0b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f60"
const search = { action: "search", spaceId, q: "dune" }

function setup(overrides: Partial<Gate> = {}) {
  const counts = new Map<string, number>()
  const gate: Gate = {
    userFor: async (token) => (token === "good" ? "user-1" : null),
    isMember: async (_token, space) => space === spaceId,
    consume: async (user) => {
      counts.set(user, (counts.get(user) ?? 0) + 1)
      return (counts.get(user) ?? 0) <= RATE_LIMIT.max
    },
    ...overrides,
  }
  const get = vi.fn(async () => ({ ok: true as const, body: { results: [], total_pages: 0 } }))
  const service = createCatalogService({ cache: new MemoryCache(), tmdb: { get } })
  const handle = createCatalogHandler({ allowedOrigins: [origin], gate, service })
  type Init = { token?: string; origin?: string | null; method?: string }
  const call = (body: unknown, init: Init = {}) =>
    handle(
      new Request("http://fn.test/catalog", {
        method: init.method ?? "POST",
        headers: {
          ...(init.origin === null ? {} : { origin: init.origin ?? origin }),
          authorization: `Bearer ${init.token ?? "good"}`,
        },
        body: init.method === "OPTIONS" ? null : JSON.stringify(body),
      }),
    )
  return { call, get }
}

const kindOf = async (response: Response) =>
  ((await response.json()) as { error: { kind: string } }).error.kind

describe("catalog handler", () => {
  it("answers a member's search with CORS for the allowed origin", async () => {
    const response = await setup().call(search)
    expect(response.status).toBe(200)
    expect(response.headers.get("access-control-allow-origin")).toBe(origin)
    expect(await response.json()).toMatchObject({ results: [], page: 1, stale: false })
  })

  it("refuses unknown origins and requests without one, before touching TMDB", async () => {
    const { call, get } = setup()
    const denied = await call(search, { origin: "https://evil.example" })
    expect(denied.status).toBe(403)
    expect(denied.headers.get("access-control-allow-origin")).toBeNull()
    expect((await call(search, { origin: null })).status).toBe(403)
    expect(get).not.toHaveBeenCalled()
  })

  it("requires a valid JWT", async () => {
    const response = await setup().call(search, { token: "forged" })
    expect(response.status).toBe(401)
    expect(await kindOf(response)).toBe("unauthenticated")
  })

  it("refuses spaces the caller is not a member of, before touching TMDB", async () => {
    const { call, get } = setup()
    const response = await call({ ...search, spaceId: "1b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f60" })
    expect(response.status).toBe(403)
    expect(get).not.toHaveBeenCalled()
  })

  it("rejects a one-letter search as validation, before TMDB", async () => {
    const { call, get } = setup()
    const response = await call({ action: "search", spaceId, q: "x" })
    expect(response.status).toBe(400)
    expect(await kindOf(response)).toBe("validation")
    expect(get).not.toHaveBeenCalled()
  })

  it("returns 429 once the caller passes 30 requests per minute", async () => {
    const { call } = setup()
    for (let i = 0; i < RATE_LIMIT.max; i++) expect((await call(search)).status).toBe(200)
    const limited = await call(search)
    expect(limited.status).toBe(429)
    expect(await kindOf(limited)).toBe("rate_limited")
  })

  it("hides internal failures behind 503", async () => {
    const { call } = setup({
      isMember: async () => {
        throw new Error("connection refused at db:5432")
      },
    })
    const response = await call(search)
    expect(response.status).toBe(503)
    expect(JSON.stringify(await response.json())).not.toMatch(/5432/)
  })
})
