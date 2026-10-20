import { describe, expect, it } from "vitest"
import { describeRange, episodeCount, nextTogether, validateRange } from "./episode-range"

const ep = (season: number, episode: number) => ({ season, episode })

describe("nextTogether", () => {
  it("starts at the first episode when nothing was watched together", () => {
    expect(nextTogether(null)).toEqual(ep(1, 1))
  })

  it("is the episode after the together pointer", () => {
    expect(nextTogether(ep(2, 3))).toEqual(ep(2, 4))
  })

  it("moves into the next season after the last episode, when the season length is known", () => {
    expect(nextTogether(ep(2, 10), 10)).toEqual(ep(3, 1))
    expect(nextTogether(ep(2, 9), 10)).toEqual(ep(2, 10))
  })
})

describe("validateRange", () => {
  it("accepts a forward range in one season", () => {
    expect(validateRange({ from: ep(1, 3), to: ep(1, 4) })).toEqual({ ok: true, value: undefined })
  })

  it("refuses a range that runs backwards or starts before episode one", () => {
    expect(validateRange({ from: ep(1, 5), to: ep(1, 2) }).ok).toBe(false)
    expect(validateRange({ from: ep(1, 0), to: ep(1, 2) }).ok).toBe(false)
  })

  it("needs the episode count of every season it leaves", () => {
    expect(validateRange({ from: ep(1, 5), to: ep(2, 1), seasonEpisodeCounts: [6] }).ok).toBe(true)
    expect(validateRange({ from: ep(1, 5), to: ep(3, 1), seasonEpisodeCounts: [6] }).ok).toBe(false)
    expect(validateRange({ from: ep(1, 5), to: ep(2, 1) }).ok).toBe(false)
    expect(validateRange({ from: ep(1, 7), to: ep(2, 1), seasonEpisodeCounts: [6] }).ok).toBe(false)
    expect(validateRange({ from: ep(1, 1), to: ep(2, 1), seasonEpisodeCounts: [0] }).ok).toBe(false)
  })
})

describe("describing a range", () => {
  it("names one episode or the first and last", () => {
    expect(describeRange({ from: ep(2, 3), to: ep(2, 3) })).toBe("S2E3")
    expect(describeRange({ from: ep(1, 5), to: ep(2, 1) })).toBe("S1E5 to S2E1")
  })

  it("counts the episodes in it", () => {
    expect(episodeCount({ from: ep(1, 3), to: ep(1, 4) })).toBe(2)
    expect(episodeCount({ from: ep(1, 5), to: ep(2, 2), seasonEpisodeCounts: [6] })).toBe(4)
  })
})
