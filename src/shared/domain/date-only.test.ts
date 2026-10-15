import { describe, expect, it } from "vitest"
import { compareDateOnly, isDateOnly, todayDateOnly, toDateOnly } from "./date-only"

describe("DateOnly", () => {
  it("accepts real calendar dates only", () => {
    expect(isDateOnly("2026-02-28")).toBe(true)
    expect(isDateOnly("2026-02-30")).toBe(false)
    expect(isDateOnly("2026-2-1")).toBe(false)
  })

  it("derives today in the local calendar, not UTC", () => {
    const lateNightJohannesburg = new Date(2026, 9, 15, 23, 30)
    expect(todayDateOnly(lateNightJohannesburg)).toBe("2026-10-15")
  })

  it("compares lexically", () => {
    expect(compareDateOnly("2026-01-02", "2026-01-10")).toBeLessThan(0)
  })

  it("parses input", () => {
    expect(toDateOnly("2026-10-15").ok).toBe(true)
    expect(toDateOnly("15/10/2026").ok).toBe(false)
  })
})
