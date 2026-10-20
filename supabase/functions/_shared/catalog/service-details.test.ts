import { describe, expect, it, vi } from "vitest"
import { detailsKey } from "./cache.ts"
import { MemoryCache } from "./memory-cache.ts"
import { createCatalogService } from "./service.ts"
import type { TmdbResult } from "./tmdb-client.ts"

const body = (provider: string) => ({
  id: 7,
  title: "Spirited Away",
  "watch/providers": { results: { ZA: { flatrate: [{ provider_name: provider }] } } },
})

function setup(...replies: TmdbResult[]) {
  let clock = new Date("2026-10-15T10:00:00.000Z")
  const cache = new MemoryCache()
  const get = vi.fn(
    async (_path: string) => replies.shift() ?? { ok: false as const, failure: "outage" as const },
  )
  const service = createCatalogService({ cache, tmdb: { get }, now: () => clock })
  const advance = (ms: number) => (clock = new Date(clock.getTime() + ms))
  return { cache, get, service, advance }
}

describe("catalog details", () => {
  it("returns the title with providers and caches it for 24 hours", async () => {
    const { cache, get, service, advance } = setup({ ok: true, body: body("Netflix") })
    const result = await service.details("movie", 7)
    expect(result).toMatchObject({ ok: true, body: { title: { id: 7 }, stale: false } })
    expect(get.mock.calls[0]?.[0]).toBe(
      "movie/7?language=en-US&append_to_response=watch/providers,videos,recommendations",
    )
    expect(cache.entries.get(detailsKey("movie", 7))?.expiresAt).toBe("2026-10-16T10:00:00.000Z")
    advance(23 * 60 * 60 * 1000)
    await service.details("movie", 7)
    expect(get).toHaveBeenCalledTimes(1)
  })

  it("maps a missing title to not_found", async () => {
    const { service } = setup({ ok: false, failure: "not_found" })
    expect(await service.details("tv", 9)).toMatchObject({
      ok: false,
      kind: "not_found",
      status: 404,
    })
  })

  it("maps misconfiguration to unavailable without detail", async () => {
    const { service } = setup({ ok: false, failure: "unavailable" })
    const result = await service.details("tv", 9)
    expect(result).toMatchObject({ ok: false, kind: "unavailable", status: 503 })
  })

  it("refresh expires the cached title and fetches it again", async () => {
    const { get, service } = setup(
      { ok: true, body: body("Netflix") },
      { ok: true, body: body("Showmax") },
    )
    await service.details("movie", 7)
    const fresh = await service.refresh("movie", 7)
    expect(get).toHaveBeenCalledTimes(2)
    expect(
      fresh.ok &&
        "availability" in fresh.body &&
        fresh.body.availability.regions[0]?.categories[0]?.providers,
    ).toEqual(["Showmax"])
  })

  it("refresh during an outage falls back to the previous copy flagged stale", async () => {
    const { service } = setup({ ok: true, body: body("Netflix") }, { ok: false, failure: "outage" })
    await service.details("movie", 7)
    expect(await service.refresh("movie", 7)).toMatchObject({ ok: true, body: { stale: true } })
  })
})
