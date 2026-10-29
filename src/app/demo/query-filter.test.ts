import { describe, expect, it } from "vitest"
import { anyOf, matches } from "./query-filter"

describe("demo filters", () => {
  it("compares numbers as numbers and treats is.null as missing", () => {
    expect(matches(10, "gt.9")).toBe(true)
    expect(matches(null, "is.null")).toBe(true)
    expect(matches(undefined, "is.null")).toBe(true)
    expect(matches(2, "lte.3")).toBe(true)
    expect(matches(null, "lt.3")).toBe(false)
  })

  it("reads or lists with nested and", () => {
    const shown = "(season.is.null,season.lt.1,and(season.eq.1,episode.lte.3))"
    expect(anyOf({ season: 1, episode: 2 }, shown)).toBe(true)
    expect(anyOf({ season: 1, episode: 4 }, shown)).toBe(false)
    expect(anyOf({ season: null, episode: null }, shown)).toBe(true)
    const cursor =
      '(created_at.lt."2026-10-15T09:00:00",and(created_at.eq."2026-10-15T09:00:00",id.lt.c1))'
    expect(anyOf({ created_at: "2026-10-15T08:00:00", id: "c9" }, cursor)).toBe(true)
  })
})
