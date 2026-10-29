import { describe, expect, it } from "vitest"
import { memberRows, rangeLabel, seasonsLabel, type SeasonFact } from "./title-facts"

const seasons: SeasonFact[] = [
  { number: 1, episodeCount: 10 },
  { number: 2, episodeCount: 12 },
]
const at = (userId: string, season: number | null, episode: number | null) => ({
  userId,
  status: "watching" as const,
  season,
  episode,
  completedOn: null,
  updatedAt: "",
})
const names = [
  { id: "a", displayName: "Ana" },
  { id: "b", displayName: "Ben" },
  { id: "c", displayName: "Cy" },
]

describe("title facts", () => {
  it("counts seasons without naming the type", () => {
    expect(seasonsLabel(seasons)).toBe("2 seasons")
    expect(seasonsLabel(seasons.slice(0, 1))).toBe("1 season")
    expect(seasonsLabel([])).toBeNull()
  })

  it("puts you first, each with a bar through their own season, and marks who is ahead", () => {
    const rows = memberRows([at("b", 1, 5), at("a", 1, 3), at("c", 2, 6)], "a", names, seasons)
    expect(rows.map((r) => [r.name, r.place, r.fraction, r.ahead])).toEqual([
      ["Ana (you)", "S1E3", 0.3, false],
      ["Ben", "S1E5", 0.5, true],
      ["Cy", "S2E6", 0.5, true],
    ])
    expect(rows[0]!.me).toBe(true)
  })

  it("shows you even before you start", () => {
    expect(memberRows([], "a", names, seasons)[0]).toMatchObject({ name: "Ana (you)", place: null })
  })

  it("reads a party's range as episodes, crossing seasons in full", () => {
    const range = (s1: number, e1: number, s2: number, e2: number) => ({
      from: { season: s1, episode: e1 },
      to: { season: s2, episode: e2 },
    })
    expect(rangeLabel(range(1, 2, 1, 3))).toBe("E2 to E3")
    expect(rangeLabel(range(1, 4, 1, 4))).toBe("E4")
    expect(rangeLabel(range(1, 10, 2, 1))).toBe("S1E10 to S2E1")
    expect(rangeLabel(null)).toBeNull()
  })
})
