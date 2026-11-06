import { describe, expect, it } from "vitest"
import { ok } from "@/shared/domain"
import type { CatalogService } from "@/features/catalog"
import { catalogNext } from "./playback-next"
const target = { spaceId: "s", itemId: "i", catalog: { type: "tv", id: 1396 } } as const
const ref = { kind: "episode", tmdbId: 1396, season: 1, episode: 1 } as const
const catalog = {
  details: async () => ok({ seasons: [{ number: 2 }, { number: 0 }, { number: 1 }] }),
  season: async (_s: string, _id: number, season: number) =>
    ok({
      episodes:
        season === 1
          ? [
              { number: 1, name: "Pilot" },
              { number: 2, name: "Second" },
            ]
          : [{ number: 1, name: "Return" }],
    }),
} as unknown as CatalogService

describe("catalog next episode", () => {
  it("works without Jellyfin and uses the actual episode title", async () => {
    expect(await catalogNext(catalog, target, ref)).toEqual(
      ok({ season: 1, episode: 2, title: "Second" }),
    )
  })
  it("crosses seasons, excludes specials and stops at the series end", async () => {
    expect(await catalogNext(catalog, target, { ...ref, episode: 2 })).toEqual(
      ok({ season: 2, episode: 1, title: "Return" }),
    )
    expect(await catalogNext(catalog, target, { ...ref, season: 2 })).toEqual(ok(null))
  })
})
