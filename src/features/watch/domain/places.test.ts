import { describe, expect, it } from "vitest"
import { aheadOf, parsePlaces, parseTogether, placeHeading, placeLabel } from "./places"

describe("places", () => {
  it("reads every member's place from the list row, skipping anything malformed", () => {
    const json = [
      { user_id: "a", status: "watching", season: 1, episode: 4 },
      { user_id: "b", status: "completed", season: null, episode: null },
      { user_id: 3, status: "watching" },
      { user_id: "c", status: "sideways", season: 1, episode: 1 },
    ]
    expect(parsePlaces(json)).toEqual([
      { userId: "a", status: "watching", season: 1, episode: 4 },
      { userId: "b", status: "completed", season: null, episode: null },
    ])
    expect(parsePlaces(null)).toEqual([])
  })

  it("reads the together pointer, a film's as a place with no episode", () => {
    expect(parseTogether({ season: 2, episode: 1 })).toEqual({ season: 2, episode: 1 })
    expect(parseTogether({ season: null, episode: null })).toEqual({ season: null, episode: null })
    expect(parseTogether(null)).toBeNull()
    expect(parseTogether({ season: "2" })).toBeNull()
  })

  it("labels a place as S1E3, and a place with no episode as nothing", () => {
    expect(placeLabel({ season: 1, episode: 3 })).toBe("S1E3")
    expect(placeLabel({ season: null, episode: null })).toBeNull()
  })

  it("spaces the title page's heading as S1 E3", () => {
    expect(placeHeading({ season: 1, episode: 3 })).toBe("S1 E3")
    expect(placeHeading({ season: 1, episode: null })).toBeNull()
  })

  it("knows who is ahead of where you are together", () => {
    const together = { season: 1, episode: 4 }
    expect(aheadOf({ season: 1, episode: 5 }, together)).toBe(true)
    expect(aheadOf({ season: 2, episode: 1 }, together)).toBe(true)
    expect(aheadOf({ season: 1, episode: 4 }, together)).toBe(false)
    expect(aheadOf({ season: 1, episode: 2 }, together)).toBe(false)
    expect(aheadOf({ season: 1, episode: 1 }, null)).toBe(true)
    expect(aheadOf({ season: null, episode: null }, together)).toBe(false)
  })
})
