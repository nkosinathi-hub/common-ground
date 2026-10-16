import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import { eventIcs, icsFileName, icsText } from "./ics"

const now = new Date("2026-10-16T09:30:05Z")
const base = {
  id: "e1",
  title: "Movie night",
  description: "",
  location: "",
  repeatsYearly: false,
  timing: {
    allDay: false as const,
    startsAt: "2026-10-16T06:00:00Z",
    endsAt: "2026-10-16T08:00:00Z",
  },
}
const lines = (text: string) => text.split("\r\n")

describe("ics", () => {
  it("writes one timed event in UTC with CRLF line endings", () => {
    const text = eventIcs(base, now)
    expect(text.endsWith("END:VCALENDAR\r\n")).toBe(true)
    expect(lines(text)).toEqual(
      expect.arrayContaining([
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Common Ground//Calendar//EN",
        "BEGIN:VEVENT",
        "UID:e1@common-ground",
        "DTSTAMP:20261016T093005Z",
        "DTSTART:20261016T060000Z",
        "DTEND:20261016T080000Z",
        "SUMMARY:Movie night",
        "END:VEVENT",
      ]),
    )
    expect(text).not.toContain("LOCATION")
  })

  it("writes all-day events as dates with an exclusive end, and yearly ones repeat", () => {
    const timing = {
      allDay: true as const,
      startDate: "2026-12-31" as DateOnly,
      endDate: "2026-12-31" as DateOnly,
    }
    const text = eventIcs({ ...base, timing, repeatsYearly: true }, now)
    expect(lines(text)).toEqual(
      expect.arrayContaining([
        "DTSTART;VALUE=DATE:20261231",
        "DTEND;VALUE=DATE:20270101",
        "RRULE:FREQ=YEARLY",
      ]),
    )
  })

  it("escapes text values per RFC 5545", () => {
    expect(icsText("a\\b; c, d\r\ne\nf")).toBe("a\\\\b\\; c\\, d\\ne\\nf")
    const text = eventIcs(
      { ...base, location: "Ana's; flat", description: "Bring snacks,\nplease" },
      now,
    )
    expect(lines(text)).toContain("LOCATION:Ana's\\; flat")
    expect(lines(text)).toContain("DESCRIPTION:Bring snacks\\,\\nplease")
  })

  it("folds lines longer than 75 octets without splitting a character", () => {
    const text = eventIcs({ ...base, title: "é".repeat(60) }, now)
    const summary = lines(text).filter((line) => line.startsWith("SUMMARY") || line.startsWith(" "))
    expect(summary.length).toBeGreaterThan(1)
    const encoder = new TextEncoder()
    for (const line of summary) expect(encoder.encode(line).length).toBeLessThanOrEqual(75)
    expect(summary.map((line, i) => (i ? line.slice(1) : line)).join("")).toBe(
      `SUMMARY:${"é".repeat(60)}`,
    )
  })

  it("names the file after the event", () => {
    expect(icsFileName("Movie night: Dune!")).toBe("movie-night-dune.ics")
    expect(icsFileName("!!!")).toBe("event.ics")
  })
})
