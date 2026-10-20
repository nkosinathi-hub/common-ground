import { describe, expect, it, vi } from "vitest"
import { appError, err, ok, type Result } from "@/shared/domain"
import type { CatalogService } from "@/features/catalog"
import { catalogTmdb } from "./catalog-tmdb"

const signal = new AbortController().signal
const details = (over: object = {}) =>
  ok({ trailerKey: "dQw4w9WgXcQ", imdbId: "tt1254207", ...over })

function setup(reply: Result<object> = details(), space: string | null = "s1") {
  const lookup = vi.fn(async () => reply)
  const catalog = { details: lookup } as unknown as CatalogService
  return { lookup, tmdb: catalogTmdb(catalog, () => space) }
}

describe("catalogTmdb", () => {
  it("gives a film's IMDb id and official trailer from one cached catalog call", async () => {
    const { lookup, tmdb } = setup()
    const film = { kind: "movie", tmdbId: 10378 } as const
    expect(await tmdb.imdbId(film, signal)).toEqual(ok("tt1254207"))
    expect(await tmdb.videos(film, signal)).toEqual(
      ok([{ key: "dQw4w9WgXcQ", site: "YouTube", type: "Trailer", official: true }]),
    )
    expect(lookup).toHaveBeenCalledOnce()
    expect(lookup).toHaveBeenCalledWith("s1", { type: "movie", id: 10378 }, signal)
  })

  it("looks an episode up by its series", async () => {
    const { lookup, tmdb } = setup()
    await tmdb.videos({ kind: "episode", tmdbId: 1399, season: 1, episode: 1 }, signal)
    expect(lookup).toHaveBeenCalledWith("s1", { type: "tv", id: 1399 }, signal)
  })

  it("finds nothing without a trailer, outside a space, or when the catalog fails", async () => {
    expect(
      await setup(details({ trailerKey: null, imdbId: null })).tmdb.videos(
        { kind: "movie", tmdbId: 1 },
        signal,
      ),
    ).toEqual(ok([]))
    expect(await setup(details(), null).tmdb.imdbId({ kind: "movie", tmdbId: 1 }, signal)).toEqual(
      ok(null),
    )
    const failing = setup(err(appError("network", "offline")))
    expect((await failing.tmdb.imdbId({ kind: "movie", tmdbId: 1 }, signal)).ok).toBe(false)
  })
})
