import { describe, expect, it } from "vitest"
import { mapNextEpisode, mapRecommendations, mapSeasons, mapTrailer } from "./extras.ts"

describe("mapTrailer", () => {
  const video = (over: object) => ({
    site: "YouTube",
    type: "Trailer",
    official: true,
    key: "dQw4w9WgXcQ",
    ...over,
  })

  it("picks an official YouTube trailer", () => {
    const results = [video({ type: "Teaser", key: "aaaaaaaaaaa" }), video({})]
    expect(mapTrailer({ results })).toBe("dQw4w9WgXcQ")
  })

  it("falls back to an unofficial trailer, never to another site or a bad key", () => {
    expect(mapTrailer({ results: [video({ official: false, key: "bbbbbbbbbbb" })] })).toBe(
      "bbbbbbbbbbb",
    )
    expect(mapTrailer({ results: [video({ site: "Vimeo" })] })).toBeNull()
    expect(mapTrailer({ results: [video({ key: "x/../../y" })] })).toBeNull()
    expect(mapTrailer(undefined)).toBeNull()
  })
})

describe("mapRecommendations", () => {
  it("maps up to twelve titles of the same type, skipping broken ones", () => {
    const results = [
      ...Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `Show ${i + 1}` })),
      { name: "No id" },
    ]
    const recs = mapRecommendations({ results }, "tv")
    expect(recs).toHaveLength(12)
    expect(recs[0]).toMatchObject({ id: 1, type: "tv", title: "Show 1" })
  })

  it("is empty when TMDB has none", () => {
    expect(mapRecommendations(undefined, "movie")).toEqual([])
  })
})

describe("mapSeasons", () => {
  it("lists seasons in order, specials included as season 0", () => {
    const seasons = mapSeasons({
      seasons: [
        { season_number: 1, name: "Season 1", episode_count: 10, air_date: "2011-04-17" },
        { season_number: 0, name: "Specials", episode_count: 3, air_date: null },
      ],
    })
    expect(seasons).toEqual([
      { number: 0, name: "Specials", episodeCount: 3, airDate: null },
      { number: 1, name: "Season 1", episodeCount: 10, airDate: "2011-04-17" },
    ])
  })

  it("is empty for a movie", () => {
    expect(mapSeasons({ title: "A film" })).toEqual([])
  })
})

describe("mapNextEpisode", () => {
  it("reads the next episode to air", () => {
    const raw = {
      next_episode_to_air: { season_number: 2, episode_number: 4, air_date: "2026-11-01" },
    }
    expect(mapNextEpisode(raw)).toEqual({ season: 2, episode: 4, airDate: "2026-11-01" })
    expect(mapNextEpisode({})).toBeNull()
  })
})
