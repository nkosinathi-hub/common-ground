import { describe, expect, it } from "vitest"
import { episodeRows, seasonsOf } from "./episodes"

const watched = [
  { season: 1, episode: 1, togetherOn: null, watchedBy: ["ana", "ben"] },
  { season: 1, episode: 2, togetherOn: "2026-10-27", watchedBy: ["ana", "ben"] },
  { season: 2, episode: 1, togetherOn: null, watchedBy: ["ana"] },
]

describe("episode rows", () => {
  it("marks each episode together, seen, up next or not watched", () => {
    const rows = episodeRows(1, 4, watched, { season: 1, episode: 2 })
    expect(rows.map((r) => r.state.kind)).toEqual(["seen", "together", "next", "unseen"])
    expect(rows[1]!.state).toEqual({ kind: "together", on: "2026-10-27" })
  })

  it("has no up next in a season the space has not reached together", () => {
    expect(episodeRows(2, 2, watched, { season: 1, episode: 2 }).map((r) => r.state.kind)).toEqual([
      "seen",
      "unseen",
    ])
  })

  it("offers every season reached, in order, starting with the first", () => {
    expect(seasonsOf(watched, { season: 1, episode: 2 })).toEqual([1, 2])
    expect(seasonsOf([], null)).toEqual([1])
  })
})
