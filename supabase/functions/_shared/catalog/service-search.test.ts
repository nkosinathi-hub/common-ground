import { describe, expect, it, vi } from "vitest"
import { searchKey } from "./cache.ts"
import { MemoryCache } from "./memory-cache.ts"
import { createCatalogService } from "./service.ts"
import type { TmdbClient, TmdbResult } from "./tmdb-client.ts"

const body = { results: [{ id: 1, media_type: "movie", title: "Dune" }], total_pages: 2 }

function setup(...replies: TmdbResult[]) {
  let clock = new Date("2026-10-15T10:00:00.000Z")
  const cache = new MemoryCache()
  const get = vi.fn(
    async () => replies.shift() ?? { ok: false as const, failure: "outage" as const },
  )
  const tmdb: TmdbClient = { get }
  const service = createCatalogService({ cache, tmdb, now: () => clock })
  const advance = (ms: number) => (clock = new Date(clock.getTime() + ms))
  return { cache, get, service, advance }
}

describe("catalog search", () => {
  it("fetches, maps and caches for 15 minutes", async () => {
    const { cache, get, service, advance } = setup({ ok: true, body })
    const first = await service.search("Dune", 1)
    expect(first).toMatchObject({ ok: true, body: { page: 1, totalPages: 2, stale: false } })
    expect(first.ok && first.body.checkedAt).toBe("2026-10-15T10:00:00.000Z")
    expect(cache.entries.get(searchKey("dune", 1))?.expiresAt).toBe("2026-10-15T10:15:00.000Z")
    advance(14 * 60 * 1000)
    expect(await service.search("dune", 1)).toMatchObject({ ok: true, body: { stale: false } })
    expect(get).toHaveBeenCalledTimes(1)
  })

  it("refetches once the entry has expired", async () => {
    const { get, service, advance } = setup({ ok: true, body }, { ok: true, body })
    await service.search("dune", 1)
    advance(15 * 60 * 1000)
    await service.search("dune", 1)
    expect(get).toHaveBeenCalledTimes(2)
  })

  it("serves the expired copy flagged stale when TMDB is down", async () => {
    const { service, advance } = setup({ ok: true, body }, { ok: false, failure: "outage" })
    await service.search("dune", 1)
    advance(60 * 60 * 1000)
    const result = await service.search("dune", 1)
    expect(result).toMatchObject({
      ok: true,
      body: { stale: true, checkedAt: "2026-10-15T10:00:00.000Z" },
    })
  })

  it("answers 503 unavailable when TMDB is down and nothing is cached", async () => {
    const { service } = setup({ ok: false, failure: "outage" })
    expect(await service.search("dune", 1)).toMatchObject({
      ok: false,
      kind: "unavailable",
      status: 503,
    })
  })

  it("reports TMDB rate limiting as rate_limited without serving stale data", async () => {
    const { service, advance } = setup({ ok: true, body }, { ok: false, failure: "rate_limited" })
    await service.search("dune", 1)
    advance(60 * 60 * 1000)
    expect(await service.search("dune", 1)).toMatchObject({
      ok: false,
      kind: "rate_limited",
      status: 429,
    })
  })

  it("still answers when the cache itself fails", async () => {
    const { cache, service } = setup({ ok: true, body })
    cache.get = async () => {
      throw new Error("db down")
    }
    cache.put = async () => {
      throw new Error("db down")
    }
    expect(await service.search("dune", 1)).toMatchObject({ ok: true })
  })
})
