import { describe, expect, it, vi } from "vitest"
import { parseDiscover } from "./discover-request.ts"
import { mergeSources } from "./discover.ts"
import { MemoryCache } from "./memory-cache.ts"
import { createCatalogService } from "./service.ts"
import type { CatalogTitle } from "./types.ts"

const space = "0b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f60"
const t = (id: number, type: "movie" | "tv" = "movie") =>
  ({
    id,
    type,
    title: `T${id}`,
    year: null,
    mediaKind: "movie",
    posterPath: null,
    synopsis: "",
  }) as CatalogTitle

describe("discover request", () => {
  it("takes liked titles, known genres and exclusions within their limits", () => {
    const ok = parseDiscover(
      { liked: [{ type: "tv", id: 1 }], genres: ["drama"], exclude: ["tv:1"] },
      space,
    )
    expect(ok.ok).toBe(true)
    expect(parseDiscover({ genres: ["sitcom"] }, space).ok).toBe(false)
    const six = Array.from({ length: 6 }, (_, i) => ({ type: "movie", id: i + 1 }))
    expect(parseDiscover({ liked: six }, space).ok).toBe(false)
    expect(parseDiscover({ exclude: ["film:1"] }, space).ok).toBe(false)
  })
})

describe("mergeSources", () => {
  it("ranks what more sources suggest, leaves out the space's and your dislikes, says why", () => {
    const merged = mergeSources(
      [
        { because: "Severance", titles: [t(1), t(2), t(3)] },
        { because: "Drama", titles: [t(3), t(4)] },
      ],
      new Set(["movie:2"]),
    )
    expect(merged.map((m) => [m.id, m.because])).toEqual([
      [3, "Severance"],
      [1, "Severance"],
      [4, "Drama"],
    ])
  })
})

describe("discover through the catalog service", () => {
  it("asks TMDB for the liked title's recommendations and each genre, through the cache", async () => {
    const get = vi.fn(async (path: string) => ({
      ok: true as const,
      body: path.startsWith("tv/1?")
        ? { id: 1, name: "Severance", recommendations: { results: [{ id: 9, name: "Dark" }] } }
        : {
            results: [
              { id: 9, title: "Dark" },
              { id: 10, title: "Arrival" },
            ],
          },
    }))
    const service = createCatalogService({ cache: new MemoryCache(), tmdb: { get } })
    const request = {
      action: "discover",
      spaceId: space,
      liked: [{ type: "tv", id: 1 }],
      genres: ["scifi"],
      exclude: ["movie:10"],
    } as const
    const found = await service.discover(request)
    expect(found.ok && found.body.results.map((r) => `${r.type}:${r.id}:${r.because}`)).toEqual([
      "tv:9:Severance",
      "movie:9:Science fiction",
      "tv:10:Science fiction",
    ])
    await service.discover(request)
    expect(get).toHaveBeenCalledTimes(3)
  })
})
