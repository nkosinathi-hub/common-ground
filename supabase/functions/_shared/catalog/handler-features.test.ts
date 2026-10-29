import { describe, expect, it, vi } from "vitest"
import type { Gate } from "../http/gate.ts"
import type { TitleFeatures } from "./features.ts"
import { createCatalogHandler } from "./handler.ts"
import { MemoryCache } from "./memory-cache.ts"
import { createCatalogService } from "./service.ts"

const origin = "http://127.0.0.1:5173"
const spaceId = "0b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f60"
const gate: Gate = {
  userFor: async () => "user-1",
  isMember: async () => true,
  consume: async () => true,
}
const tmdbTitle = {
  id: 7,
  name: "Show",
  genres: [{ id: 18 }, { id: 10759 }],
  "watch/providers": { results: { ZA: { flatrate: [{ provider_name: "Netflix" }] } } },
}

function setup(write: (f: TitleFeatures) => Promise<void>) {
  const get = vi.fn(async () => ({ ok: true as const, body: tmdbTitle }))
  const service = createCatalogService({ cache: new MemoryCache(), tmdb: { get } })
  const handle = createCatalogHandler({ allowedOrigins: [origin], gate, service, features: write })
  return (body: unknown) =>
    handle(
      new Request("http://fn.test/catalog", {
        method: "POST",
        headers: { origin, authorization: "Bearer good" },
        body: JSON.stringify(body),
      }),
    )
}

describe("catalog handler features", () => {
  it("stores the title's genres and streaming after serving its details", async () => {
    const write = vi.fn(async () => {})
    const response = await setup(write)({ action: "details", spaceId, type: "tv", id: 7 })
    expect(response.status).toBe(200)
    expect(write).toHaveBeenCalledWith({
      spaceId,
      type: "tv",
      id: 7,
      genres: ["action", "adventure", "drama"],
      streamable: true,
    })
  })

  it("still answers when storing the features fails", async () => {
    const response = await setup(async () => {
      throw new Error("down")
    })({ action: "details", spaceId, type: "tv", id: 7 })
    expect(response.status).toBe(200)
  })
})
