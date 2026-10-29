import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { DateOnly } from "./date-only"
import {
  formatDateOnly,
  formatDateTime,
  formatDay,
  formatLongDay,
  formatTime,
  LOCALE,
} from "./format"

const TZ = process.env.TZ
beforeEach(() => (process.env.TZ = "America/Los_Angeles"))
afterEach(() => (process.env.TZ = TZ))

describe("one locale for dates and numbers", () => {
  it("is South African English", () => {
    expect(LOCALE).toBe("en-ZA")
  })

  it("shows an instant as a day and time in the viewer's zone", () => {
    // 05:30 UTC on 16 Oct is still 15 Oct in Los Angeles.
    expect(formatDateTime("2026-10-16T05:30:00Z")).toBe("15 Oct 2026, 22:30")
    expect(formatDay("2026-10-16T05:30:00Z")).toBe("15 Oct 2026")
    expect(formatTime("2026-10-16T05:30:00Z")).toBe("22:30")
    expect(formatLongDay(new Date("2026-10-27T18:00:00Z"))).toBe("Tuesday 27 October")
  })

  it("shows a date-only value as that calendar day in any zone", () => {
    expect(formatDateOnly("2026-11-20" as DateOnly)).toBe("20 Nov 2026")
  })
})
