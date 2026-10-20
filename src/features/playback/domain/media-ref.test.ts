import { describe, expect, it } from "vitest"
import { episodeRef, movieRef, refLabel } from "./media-ref"

describe("movieRef", () => {
  it("accepts a positive TMDB id", () => {
    expect(movieRef(603)).toEqual({ ok: true, value: { kind: "movie", tmdbId: 603 } })
  })

  it.each([0, -1, 1.5, Number.NaN])("refuses tmdb id %s", (id) => {
    const result = movieRef(id)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatchObject({ kind: "validation", field: "tmdbId" })
  })
})

describe("episodeRef", () => {
  it("accepts a season and episode from 1", () => {
    const result = episodeRef(1399, 2, 3)
    expect(result).toEqual({
      ok: true,
      value: { kind: "episode", tmdbId: 1399, season: 2, episode: 3 },
    })
  })

  it("refuses season 0 (specials are never the next episode) and episode 0", () => {
    expect(episodeRef(1399, 0, 1)).toMatchObject({ ok: false, error: { field: "season" } })
    expect(episodeRef(1399, 1, 0)).toMatchObject({ ok: false, error: { field: "episode" } })
    expect(episodeRef(1399, 1.5, 1)).toMatchObject({ ok: false, error: { field: "season" } })
    expect(episodeRef(0, 1, 1)).toMatchObject({ ok: false, error: { field: "tmdbId" } })
  })
})

describe("refLabel", () => {
  it("names an episode S2E3 and a movie by its id", () => {
    const episode = episodeRef(1, 2, 3)
    const movie = movieRef(9)
    if (!episode.ok || !movie.ok) throw new Error("fixture")
    expect(refLabel(episode.value)).toBe("S2E3")
    expect(refLabel(movie.value)).toBe("movie 9")
  })
})
