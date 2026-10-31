import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import type { CalendarEntry } from "./agenda"
import { noDetail } from "../testing/entries"
import { conflicts } from "./conflicts"

const d = (value: string) => value as DateOnly
const entry = (id: string, startsAt: string, endsAt: string, patch: Partial<CalendarEntry> = {}) =>
  ({
    kind: "event",
    id,
    title: id,
    ideaId: null,
    status: null,
    myRsvp: "going",
    ...noDetail,
    timing: { allDay: false, startsAt, endsAt },
    ...patch,
  }) satisfies CalendarEntry

const target = {
  id: "me",
  timing: {
    allDay: false as const,
    startsAt: "2026-10-16T19:00:00Z",
    endsAt: "2026-10-16T21:00:00Z",
  },
}

describe("conflicts", () => {
  it("finds other events I am going to that overlap", () => {
    const entries = [
      entry("me", "2026-10-16T19:00:00Z", "2026-10-16T21:00:00Z"),
      entry("dinner", "2026-10-16T20:00:00Z", "2026-10-16T22:00:00Z"),
      entry("before", "2026-10-16T17:00:00Z", "2026-10-16T19:00:00Z"),
      entry("maybe", "2026-10-16T19:30:00Z", "2026-10-16T20:00:00Z", { myRsvp: "maybe" }),
      entry("task", "2026-10-16T19:30:00Z", "2026-10-16T20:00:00Z", { kind: "task" }),
    ]
    expect(conflicts(target, entries, "UTC").map((e) => e.id)).toEqual(["dinner"])
  })

  it("treats all-day events as the viewer's whole days", () => {
    const trip = entry("trip", "", "", {
      timing: { allDay: true, startDate: d("2026-10-16"), endDate: d("2026-10-17") },
    })
    expect(conflicts(target, [trip], "UTC").map((e) => e.id)).toEqual(["trip"])
    // 19:00 UTC on the 16th is already the 17th in Auckland, inside the trip too.
    expect(conflicts(target, [trip], "Pacific/Auckland")).toHaveLength(1)
    const later = {
      id: "x",
      timing: {
        ...target.timing,
        startsAt: "2026-10-18T01:00:00Z",
        endsAt: "2026-10-18T02:00:00Z",
      },
    }
    expect(conflicts(later, [trip], "UTC")).toEqual([])
  })

  it("counts a zero-length event as a moment", () => {
    const moment = {
      id: "m",
      timing: {
        allDay: false as const,
        startsAt: "2026-10-16T20:00:00Z",
        endsAt: "2026-10-16T20:00:00Z",
      },
    }
    const entries = [entry("dinner", "2026-10-16T19:00:00Z", "2026-10-16T21:00:00Z")]
    expect(conflicts(moment, entries, "UTC")).toHaveLength(1)
  })
})
