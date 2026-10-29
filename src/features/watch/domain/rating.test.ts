import { describe, expect, it } from "vitest"
import type { Progress } from "./progress-types"
import { ratingLabel, withRating } from "./rating"

const saved: Progress = {
  userId: "u1",
  updatedAt: "2026-10-27T18:00:00Z",
  status: "watching",
  season: 1,
  episode: 2,
  rating: 3,
  completedOn: null,
}

describe("withRating", () => {
  it("keeps the saved place and changes only the rating", () => {
    expect(withRating(saved, 5)).toEqual({
      status: "watching",
      season: 1,
      episode: 2,
      rating: 5,
      completedOn: null,
    })
  })

  it("starts from not started when nothing is saved yet", () => {
    expect(withRating(null, 4)).toEqual({
      status: "not_started",
      season: null,
      episode: null,
      rating: 4,
      completedOn: null,
    })
  })

  it("clears the rating with null", () => {
    expect(withRating(saved, null).rating).toBeNull()
  })
})

describe("ratingLabel", () => {
  it("reads the stars as words", () => {
    expect(ratingLabel(null)).toBe("Not rated")
    expect(ratingLabel(1)).toBe("1 of 5")
    expect(ratingLabel(4)).toBe("4 of 5")
  })
})
