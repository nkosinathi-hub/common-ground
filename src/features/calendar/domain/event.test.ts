import { describe, expect, it } from "vitest"
import { validateEvent, type EventDraft } from "./event"

const draft = (patch: Partial<EventDraft> = {}): EventDraft => ({
  title: " Movie night ",
  description: "",
  location: "Lounge",
  allDay: false,
  startDate: "2026-10-16",
  endDate: "2026-10-16",
  startTime: "19:00",
  endTime: "21:00",
  timeZone: "Pacific/Auckland",
  repeatsYearly: false,
  link: null,
  reminders: [60],
  ...patch,
})

const fieldOf = (patch: Partial<EventDraft>) => {
  const result = validateEvent(draft(patch))
  return result.ok ? null : result.error.field
}

describe("validateEvent", () => {
  it("turns a timed draft into instants in the event's zone", () => {
    expect(validateEvent(draft())).toEqual({
      ok: true,
      value: {
        title: "Movie night",
        description: "",
        location: "Lounge",
        timeZone: "Pacific/Auckland",
        timing: {
          allDay: false,
          startsAt: "2026-10-16T06:00:00.000Z",
          endsAt: "2026-10-16T08:00:00.000Z",
        },
        repeatsYearly: false,
        link: null,
        reminders: [60],
      },
    })
  })

  it("keeps all-day events as dates, whatever the zone", () => {
    const result = validateEvent(
      draft({ allDay: true, endDate: "2026-10-18", timeZone: "America/Los_Angeles" }),
    )
    expect(result.ok && result.value.timing).toEqual({
      allDay: true,
      startDate: "2026-10-16",
      endDate: "2026-10-18",
    })
  })

  it("lets a timed event run past midnight into the next day", () => {
    const result = validateEvent(draft({ endDate: "2026-10-17", endTime: "01:00" }))
    expect(result.ok && result.value.timing).toMatchObject({ endsAt: "2026-10-16T12:00:00.000Z" })
  })

  it("names the field that is wrong", () => {
    expect(fieldOf({ title: "  " })).toBe("title")
    expect(fieldOf({ title: "x".repeat(201) })).toBe("title")
    expect(fieldOf({ location: "x".repeat(301) })).toBe("location")
    expect(fieldOf({ description: "x".repeat(4001) })).toBe("description")
    expect(fieldOf({ startDate: "2026-02-30" })).toBe("startDate")
    expect(fieldOf({ endDate: "soon" })).toBe("endDate")
    expect(fieldOf({ startTime: "7pm" })).toBe("startTime")
    expect(fieldOf({ endTime: "25:00" })).toBe("endTime")
    expect(fieldOf({ endTime: "18:00" })).toBe("endTime")
    expect(fieldOf({ endDate: "2026-10-31" })).toBe("endTime")
    expect(fieldOf({ allDay: true, endDate: "2026-10-15" })).toBe("endDate")
    expect(fieldOf({ allDay: true, endDate: "2026-11-16" })).toBe("endDate")
    expect(fieldOf({ timeZone: "EST" })).toBe("timeZone")
    expect(fieldOf({ reminders: [60, 10, 5, 0] })).toBe("reminders")
    expect(fieldOf({ reminders: [7] })).toBe("reminders")
    expect(fieldOf({ repeatsYearly: true })).toBe("repeatsYearly")
    expect(fieldOf({ allDay: true, endDate: "2026-10-17", repeatsYearly: true })).toBe(
      "repeatsYearly",
    )
  })

  it("allows a yearly one-day occasion, a zero-length event and drops repeated reminders", () => {
    expect(fieldOf({ allDay: true, repeatsYearly: true })).toBeNull()
    expect(fieldOf({ endTime: "19:00" })).toBeNull()
    const result = validateEvent(draft({ reminders: [10, 10], link: { kind: "idea", id: "i1" } }))
    expect(result.ok && result.value.reminders).toEqual([10])
    expect(result.ok && result.value.link).toEqual({ kind: "idea", id: "i1" })
  })
})
