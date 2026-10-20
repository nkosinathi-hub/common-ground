import { describe, expect, it, vi } from "vitest"
import { MemoryCache } from "./memory-cache.ts"
import { mapSeason, seasonPath } from "./season.ts"
import { createCatalogService } from "./service.ts"
import { parseRequest } from "./validate.ts"

const space = "00000000-0000-4000-8000-000000000001"

describe("season", () => {
  it("asks TMDB for one season of a series", () => {
    expect(seasonPath(1399, 2)).toBe("tv/1399/season/2?language=en-US")
  })

  it("maps episodes in order and drops broken ones", () => {
    const season = mapSeason({
      season_number: 2,
      episodes: [
        { episode_number: 2, name: "B", air_date: "2012-04-08", runtime: 54 },
        { episode_number: 1, name: "A", air_date: "2012-04-01", runtime: null },
        { name: "no number" },
      ],
    })
    expect(season).toEqual({
      number: 2,
      episodes: [
        { number: 1, name: "A", airDate: "2012-04-01", runtimeMinutes: null },
        { number: 2, name: "B", airDate: "2012-04-08", runtimeMinutes: 54 },
      ],
    })
  })

  it("is a catalog action for a series and a season from 0 to 200", () => {
    const ok = parseRequest({ action: "season", spaceId: space, type: "tv", id: 1399, season: 0 })
    expect(ok).toEqual({
      ok: true,
      value: { action: "season", spaceId: space, id: 1399, season: 0 },
    })
    expect(
      parseRequest({ action: "season", spaceId: space, type: "movie", id: 1, season: 1 }).ok,
    ).toBe(false)
    expect(
      parseRequest({ action: "season", spaceId: space, type: "tv", id: 1, season: 201 }).ok,
    ).toBe(false)
    expect(
      parseRequest({ action: "season", spaceId: space, type: "tv", id: 1, season: "1" }).ok,
    ).toBe(false)
  })

  it("is served and cached by the catalog service", async () => {
    const get = vi.fn(async () => ({ ok: true as const, body: { season_number: 1, episodes: [] } }))
    const service = createCatalogService({ cache: new MemoryCache(), tmdb: { get } })
    expect(await service.season(1399, 1)).toMatchObject({ ok: true, body: { number: 1 } })
    await service.season(1399, 1)
    expect(get).toHaveBeenCalledOnce()
  })
})
