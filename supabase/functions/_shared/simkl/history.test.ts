import { describe, expect, it } from "vitest"
import { moviesWatched, showsWatched } from "./history.ts"

const show = (tmdb: unknown, seasons: unknown, extra: Record<string, unknown> = {}) => ({
  show: { title: "Show", ids: { simkl: 1, tmdb } },
  seasons,
  ...extra,
})

describe("showsWatched", () => {
  it("lists every watched episode by TMDB id, season and episode", () => {
    const body = {
      shows: [
        show("1399", [
          { number: 1, episodes: [{ number: 1, watched_at: "2026-01-01T20:00:00Z" }] },
          { number: 2, episodes: [{ number: 3, watched_at: "2026-01-02T20:00:00.000Z" }] },
        ]),
      ],
    }
    expect(showsWatched(body)).toEqual([
      { type: "tv", tmdb: 1399, season: 1, episode: 1, watched_at: "2026-01-01T20:00:00.000Z" },
      { type: "tv", tmdb: 1399, season: 2, episode: 3, watched_at: "2026-01-02T20:00:00.000Z" },
    ])
  })

  it("falls back to the show's last watch when an episode carries no date", () => {
    const body = {
      shows: [
        show(5, [{ number: 1, episodes: [{ number: 2 }] }], {
          last_watched_at: "2026-02-01T00:00:00Z",
        }),
      ],
    }
    expect(showsWatched(body)[0]?.watched_at).toBe("2026-02-01T00:00:00.000Z")
  })

  it("skips shows without a TMDB id and episodes without any date or number", () => {
    const body = {
      shows: [
        show(undefined, [{ number: 1, episodes: [{ number: 1, watched_at: "2026-01-01" }] }]),
        show("abc", [{ number: 1, episodes: [{ number: 1, watched_at: "2026-01-01" }] }]),
        show(7, [{ number: 1, episodes: [{ number: 1 }, { watched_at: "2026-01-01" }] }]),
        show(8, [{ number: -1, episodes: [{ number: 1, watched_at: "2026-01-01" }] }]),
        show(9, [{ number: 1, episodes: [{ number: 1, watched_at: "not a date" }] }]),
        show(10, "junk"),
      ],
    }
    expect(showsWatched(body)).toEqual([])
  })

  it("reads an empty or malformed reply as nothing watched", () => {
    expect(showsWatched(null)).toEqual([])
    expect(showsWatched([])).toEqual([])
    expect(showsWatched({ shows: "x" })).toEqual([])
  })
})

describe("moviesWatched", () => {
  it("lists completed films with their watch date", () => {
    const body = {
      movies: [
        {
          status: "completed",
          last_watched_at: "2026-01-03T20:00:00Z",
          movie: { ids: { tmdb: 603 } },
        },
        { status: "plantowatch", movie: { ids: { tmdb: 604 } } },
        { status: "completed", movie: { ids: { tmdb: 605 } } },
        { status: "completed", last_watched_at: "2026-01-03", movie: { ids: {} } },
      ],
    }
    expect(moviesWatched(body)).toEqual([
      {
        type: "movie",
        tmdb: 603,
        season: null,
        episode: null,
        watched_at: "2026-01-03T20:00:00.000Z",
      },
    ])
  })

  it("reads an empty reply as nothing watched", () => {
    expect(moviesWatched(null)).toEqual([])
    expect(moviesWatched({ movies: null })).toEqual([])
  })
})
