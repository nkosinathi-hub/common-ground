import { describe, expect, it } from "vitest"
import { detailsPath, mapDetails } from "./details.ts"

describe("detailsPath", () => {
  it("asks for details, providers, trailers and recommendations in one request", () => {
    expect(detailsPath("tv", 1429)).toBe(
      "tv/1429?language=en-US&append_to_response=watch/providers,videos,recommendations,external_ids",
    )
  })
})

describe("mapDetails", () => {
  it("maps the title and its appended providers", () => {
    const details = mapDetails(
      {
        id: 1429,
        name: "Attack on Titan",
        original_language: "ja",
        genres: [{ id: 16, name: "Animation" }],
        "watch/providers": { results: { ZA: { flatrate: [{ provider_name: "Crunchyroll" }] } } },
      },
      "tv",
    )
    expect(details.title).toMatchObject({ id: 1429, mediaKind: "anime" })
    expect(details.availability.fallback).toBe(false)
    expect(details.availability.regions[0]?.categories[0]?.providers).toEqual(["Crunchyroll"])
  })

  it("carries the trailer, recommendations, seasons and the next episode", () => {
    const details = mapDetails(
      {
        id: 1,
        name: "S",
        videos: { results: [{ site: "YouTube", type: "Trailer", key: "dQw4w9WgXcQ" }] },
        recommendations: { results: [{ id: 2, name: "T" }] },
        seasons: [{ season_number: 1, name: "Season 1", episode_count: 8 }],
        next_episode_to_air: { season_number: 1, episode_number: 9 },
        external_ids: { imdb_id: "tt0944947" },
      },
      "tv",
    )
    expect(details).toMatchObject({
      trailerKey: "dQw4w9WgXcQ",
      recommendations: [{ id: 2, type: "tv" }],
      seasons: [{ number: 1, episodeCount: 8 }],
      nextEpisode: { season: 1, episode: 9 },
      imdbId: "tt0944947",
    })
    expect(
      mapDetails({ id: 2, title: "X", external_ids: { imdb_id: "nope" } }, "movie").imdbId,
    ).toBeNull()
  })

  it("treats missing providers as no availability anywhere", () => {
    expect(mapDetails({ id: 5, title: "X" }, "movie").availability).toEqual({
      regions: [],
      fallback: true,
    })
  })
})
