import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import type { CalendarEntry } from "../domain"
import { noDetail } from "../testing/entries"
import { entryHref, linkHref } from "./links"

const S = "00000000-0000-4000-8000-000000000001"
const day = "2026-10-16" as DateOnly
const entry = (kind: CalendarEntry["kind"]): CalendarEntry => ({
  ...noDetail,
  kind,
  id: "x1",
  title: "T",
  ideaId: "i1",
  status: null,
  myRsvp: null,
  timing: { allDay: true, startDate: day, endDate: day },
})

describe("calendar links", () => {
  it("opens events on the event route and dates on the idea's tab", () => {
    expect(entryHref(S, entry("event"))).toBe(`#/s/${S}/calendar/x1`)
    expect(entryHref(S, entry("occasion"))).toBe(`#/s/${S}/calendar/x1`)
    expect(entryHref(S, entry("task"))).toBe(`#/s/${S}/ideas/i1/tasks`)
    expect(entryHref(S, entry("milestone"))).toBe(`#/s/${S}/ideas/i1/milestones`)
  })

  it("links an event's watch item, idea or task", () => {
    expect(linkHref(S, { kind: "watch_item", id: "w1", label: "", ideaId: null })).toBe(
      `#/s/${S}/watch/w1`,
    )
    expect(linkHref(S, { kind: "idea", id: "i1", label: "", ideaId: "i1" })).toBe(
      `#/s/${S}/ideas/i1/overview`,
    )
    expect(linkHref(S, { kind: "task", id: "t1", label: "", ideaId: "i1" })).toBe(
      `#/s/${S}/ideas/i1/tasks`,
    )
    expect(linkHref(S, { kind: "task", id: "t1", label: "", ideaId: null })).toBeNull()
  })
})
