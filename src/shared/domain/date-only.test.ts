import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { compareDateOnly, isDateOnly, todayDateOnly, toDateOnly } from "./date-only"

const TZ = process.env.TZ
beforeEach(() => (process.env.TZ = "America/Los_Angeles"))
afterEach(() => (process.env.TZ = TZ))

describe("DateOnly", () => {
  it("accepts real calendar dates only", () => {
    expect(isDateOnly("2026-02-28")).toBe(true)
    expect(isDateOnly("2026-02-30")).toBe(false)
    expect(isDateOnly("2026-2-1")).toBe(false)
  })

  it("derives today in the local calendar, not UTC", () => {
    // 05:30 UTC on 16 Oct is 22:30 on 15 Oct in Los Angeles; UTC would say the 16th.
    expect(todayDateOnly(new Date("2026-10-16T05:30:00Z"))).toBe("2026-10-15")
  })

  it("compares lexically", () => {
    expect(compareDateOnly("2026-01-02", "2026-01-10")).toBeLessThan(0)
  })

  it("parses input", () => {
    expect(toDateOnly("2026-10-15").ok).toBe(true)
    expect(toDateOnly("15/10/2026").ok).toBe(false)
  })
})
