import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import { addDays, addMonths, dateOf, daysBetween, eachDay, monthOf, weekday } from "./days"

const d = (value: string) => value as DateOnly

describe("calendar days", () => {
  it("adds days across months, years and leap days without any clock", () => {
    expect(addDays(d("2026-10-31"), 1)).toBe("2026-11-01")
    expect(addDays(d("2026-12-31"), 1)).toBe("2027-01-01")
    expect(addDays(d("2028-03-01"), -1)).toBe("2028-02-29")
    expect(addDays(d("2026-03-29"), 1)).toBe("2026-03-30")
  })

  it("counts days between two dates and lists them inclusively", () => {
    expect(daysBetween(d("2026-10-16"), d("2026-11-16"))).toBe(31)
    expect(eachDay(d("2026-10-30"), d("2026-11-02"))).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ])
    expect(eachDay(d("2026-10-02"), d("2026-10-01"))).toEqual([])
  })

  it("knows the weekday (Sunday 0) and builds dates from parts", () => {
    expect(weekday(d("2026-10-16"))).toBe(5)
    expect(weekday(d("2026-10-18"))).toBe(0)
    expect(dateOf(2026, 2, 1)).toBe("2026-02-01")
  })

  it("moves whole months and reads a date's month", () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 })
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 })
    expect(addMonths({ year: 2026, month: 10 }, -14)).toEqual({ year: 2025, month: 8 })
    expect(monthOf(d("2026-10-16"))).toEqual({ year: 2026, month: 10 })
  })
})
