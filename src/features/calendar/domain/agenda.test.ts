import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import { entriesByDay, entryKey, type CalendarEntry } from "./agenda"

const d = (value: string) => value as DateOnly
const base = { ideaId: null, status: null, myRsvp: null }
const timed = (id: string, startsAt: string, endsAt: string): CalendarEntry => ({
  ...base,
  kind: "event",
  id,
  title: id,
  timing: { allDay: false, startsAt, endsAt },
})
const allDay = (id: string, start: string, end = start, kind = "event"): CalendarEntry => ({
  ...base,
  kind: kind as CalendarEntry["kind"],
  id,
  title: id,
  timing: { allDay: true, startDate: d(start), endDate: d(end) },
})

const titles = (map: Map<DateOnly, { entry: CalendarEntry }[]>, day: string) =>
  (map.get(d(day)) ?? []).map((item) => item.entry.title)

describe("entriesByDay", () => {
  it("puts timed events on the viewer's local days and all-day ones on their dates", () => {
    const entries = [
      timed("late", "2026-10-16T06:30:00Z", "2026-10-16T06:50:00Z"),
      allDay("trip", "2026-10-16", "2026-10-18"),
    ]
    const la = entriesByDay(entries, d("2026-10-14"), d("2026-10-20"), "America/Los_Angeles")
    expect(titles(la, "2026-10-15")).toEqual(["late"])
    expect(titles(la, "2026-10-16")).toEqual(["trip"])
    const auckland = entriesByDay(entries, d("2026-10-14"), d("2026-10-20"), "Pacific/Auckland")
    expect(titles(auckland, "2026-10-16")).toEqual(["trip", "late"])
    expect(titles(auckland, "2026-10-18")).toEqual(["trip"])
    expect(auckland.has(d("2026-10-19"))).toBe(false)
  })

  it("spreads multi-day events over each day with start, middle and end, clipped to the window", () => {
    const entries = [timed("camp", "2026-10-16T08:00:00Z", "2026-10-18T10:00:00Z")]
    const map = entriesByDay(entries, d("2026-10-17"), d("2026-10-31"), "UTC")
    expect([...map.keys()]).toEqual(["2026-10-17", "2026-10-18"])
    expect(map.get(d("2026-10-17"))![0]!.span).toBe("middle")
    expect(map.get(d("2026-10-18"))![0]!.span).toBe("end")
    const whole = entriesByDay(entries, d("2026-10-01"), d("2026-10-31"), "UTC")
    expect(whole.get(d("2026-10-16"))![0]!.span).toBe("start")
  })

  it("ends an event at midnight on its last day, not the next one", () => {
    const entries = [timed("film", "2026-10-16T20:00:00Z", "2026-10-17T00:00:00Z")]
    const map = entriesByDay(entries, d("2026-10-16"), d("2026-10-17"), "UTC")
    expect([...map.keys()]).toEqual(["2026-10-16"])
    expect(map.get(d("2026-10-16"))![0]!.span).toBe("single")
  })

  it("orders a day: all-day first, then timed by start, then milestones and tasks", () => {
    const entries = [
      allDay("task", "2026-10-16", "2026-10-16", "task"),
      timed("b-evening", "2026-10-16T19:00:00Z", "2026-10-16T20:00:00Z"),
      allDay("milestone", "2026-10-16", "2026-10-16", "milestone"),
      timed("a-morning", "2026-10-16T09:00:00Z", "2026-10-16T10:00:00Z"),
      allDay("birthday", "2026-10-16", "2026-10-16", "occasion"),
    ]
    const map = entriesByDay(entries, d("2026-10-16"), d("2026-10-16"), "UTC")
    expect(titles(map, "2026-10-16")).toEqual([
      "birthday",
      "a-morning",
      "b-evening",
      "milestone",
      "task",
    ])
  })

  it("keys occurrences of the same occasion apart", () => {
    const one = allDay("bd", "2026-10-16", "2026-10-16", "occasion")
    const two = allDay("bd", "2027-10-16", "2027-10-16", "occasion")
    expect(entryKey(one)).not.toBe(entryKey(two))
  })
})
