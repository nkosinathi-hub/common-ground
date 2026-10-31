import { describe, expect, it } from "vitest"
import { forYou, forYouRank } from "./for-you"

// The same titles and numbers as supabase/tests/database/watch/watch_for_you.test.sql.
const titles = [
  { id: "dramaA", genres: ["drama"], streamable: false },
  { id: "dramaB", genres: ["drama"], streamable: false },
  { id: "comedy", genres: ["comedy"], streamable: true },
  { id: "horror", genres: ["horror"], streamable: false },
]
const opinions = new Map([
  ["dramaA", "liked"],
  ["horror", "disliked"],
] as const)

describe("forYou (mirror of watch_for_you)", () => {
  it("scores like the database: genre-led, streaming only nudges, dislikes sink", () => {
    const byId = new Map(forYou(titles, opinions).map((s) => [s.itemId, s]))
    expect(byId.get("dramaB")).toMatchObject({ score: 0.3333, reason: "drama", opinion: null })
    expect(byId.get("comedy")).toMatchObject({ score: 0.1, reason: null })
    expect(byId.get("horror")).toMatchObject({ score: -0.3333, opinion: "disliked" })
  })

  it("ranks dislikes last whatever their score", () => {
    const rank = (score: number, opinion: "liked" | "disliked" | null) =>
      forYouRank({ itemId: "x", score, reason: null, opinion })
    expect(rank(0.3333, null) > rank(0.1, null)).toBe(true)
    expect(rank(0.9, "disliked") < rank(-0.5, null)).toBe(true)
    expect(rank(0.1, null)).toBe("1101000")
  })
})
