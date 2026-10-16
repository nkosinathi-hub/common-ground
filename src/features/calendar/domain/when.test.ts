import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import { cellLabel, dayHeading, entryTime, formatWhen, monthTitle, weekdayName } from "./when"

const d = (value: string) => value as DateOnly
const evening = {
  allDay: false as const,
  startsAt: "2026-10-16T06:00:00Z",
  endsAt: "2026-10-16T08:00:00Z",
}

describe("when", () => {
  it("titles months and days in the shared locale, from dates that never shift", () => {
    expect(monthTitle({ year: 2026, month: 10 })).toBe("October 2026")
    expect(dayHeading(d("2026-10-16"))).toBe("Friday 16 October")
    expect(dayHeading(d("2026-10-05"))).toBe("Monday 5 October")
    expect(cellLabel(d("2026-10-16"), 2)).toBe("Fri 16 October, 2 events")
    expect(cellLabel(d("2026-10-16"), 1)).toBe("Fri 16 October, 1 event")
    expect(cellLabel(d("2026-10-16"), 0)).toBe("Fri 16 October")
    expect([weekdayName(d("2026-10-18"), "short"), weekdayName(d("2026-10-19"), "long")]).toEqual([
      "Sun",
      "Monday",
    ])
  })

  it("formats all-day events as dates", () => {
    const one = { allDay: true as const, startDate: d("2026-10-16"), endDate: d("2026-10-16") }
    expect(formatWhen(one, "Pacific/Auckland", "UTC")).toEqual({
      text: "Fri 16 October 2026, all day",
      zoneNote: null,
    })
    const trip = { ...one, endDate: d("2026-10-18") }
    expect(formatWhen(trip, "UTC", "UTC").text).toBe("Fri 16 October 2026 to Sun 18 October 2026")
  })

  it("formats timed events in the viewer's zone and notes the event's own zone", () => {
    expect(formatWhen(evening, "Pacific/Auckland", "Pacific/Auckland")).toEqual({
      text: "Fri 16 October 2026, 19:00 to 21:00",
      zoneNote: null,
    })
    expect(formatWhen(evening, "Pacific/Auckland", "Europe/London")).toEqual({
      text: "Fri 16 October 2026, 07:00 to 09:00",
      zoneNote: "Fri 16 October 2026, 19:00 to 21:00 in Pacific/Auckland",
    })
    const late = { ...evening, endsAt: "2026-10-16T12:00:00Z" }
    expect(formatWhen(late, "Pacific/Auckland", "Pacific/Auckland").text).toBe(
      "Fri 16 October 2026, 19:00 to Sat 17 October 2026, 01:00",
    )
  })

  it("gives chips a start time on the first day only", () => {
    expect(entryTime(evening, d("2026-10-16"), "Pacific/Auckland")).toBe("19:00")
    expect(entryTime(evening, d("2026-10-17"), "Pacific/Auckland")).toBe("")
    expect(
      entryTime(
        { allDay: true, startDate: d("2026-10-16"), endDate: d("2026-10-16") },
        d("2026-10-16"),
        "UTC",
      ),
    ).toBe("")
  })
})
