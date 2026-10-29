import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { DateOnly } from "./date-only"
import {
  formatAgo,
  formatDateOnly,
  formatShortDay,
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
    expect(formatShortDay("2026-10-24" as DateOnly)).toBe("Sat 24 Oct")
  })

  it("says how long ago, as people do", () => {
    const now = new Date(2026, 9, 29, 20, 0)
    const ago = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString()
    expect(formatAgo(ago(0.001), now)).toBe("Just now")
    expect(formatAgo(ago(0.5), now)).toBe("30 min ago")
    expect(formatAgo(ago(2), now)).toBe("2 h ago")
    expect(formatAgo(ago(24), now)).toBe("Yesterday")
    expect(formatAgo(ago(72), now)).toBe("Mon")
    expect(formatAgo(ago(24 * 10), now)).toBe("19 Oct")
  })
})
