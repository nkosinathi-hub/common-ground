import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { EVENT_COLUMNS } from "./rows"
import { SupabaseCalendar } from "./supabase-calendar"
import { eventRow, listRow } from "./testing-rows"

const setup = (reply: Reply | Reply[]) => {
  const { calls, client } = recordingClient(reply)
  return { calls, calendar: new SupabaseCalendar(client as Db) }
}

describe("SupabaseCalendar", () => {
  it("reads one window through list_calendar and maps every kind", async () => {
    const rows = [
      listRow(),
      listRow({
        kind: "task",
        all_day: true,
        starts_at: null,
        ends_at: null,
        start_date: "2026-10-17",
        end_date: "2026-10-17",
        status: "todo",
        my_rsvp: null,
      }),
    ]
    const { calls, calendar } = setup({ data: rows, error: null })
    const result = await calendar.range("s1", "2026-10-01" as never, "2026-10-31" as never, "UTC")
    expect(calls).toEqual([
      [
        "rpc",
        "list_calendar",
        { target_space: "s1", from_date: "2026-10-01", to_date: "2026-10-31", tz: "UTC" },
      ],
    ])
    expect(result).toMatchObject({ ok: true, value: { truncated: false } })
    const [event, task] = result.ok ? result.value.entries : []
    expect(event).toMatchObject({
      kind: "event",
      myRsvp: "going",
      timing: { allDay: false, startsAt: "2026-10-16T06:00:00+00:00" },
    })
    expect(task).toMatchObject({
      kind: "task",
      ideaId: "i1",
      status: "todo",
      timing: { allDay: true, startDate: "2026-10-17" },
    })
  })

  it("flags a full window as truncated", async () => {
    const { calendar } = setup({ data: Array.from({ length: 1000 }, () => listRow()), error: null })
    const result = await calendar.range("s1", "2026-10-01" as never, "2026-10-31" as never, "UTC")
    expect(result.ok && result.value.truncated).toBe(true)
  })

  it("gets an event with its link, attendees and my reminders", async () => {
    const { calls, calendar } = setup({ data: eventRow(), error: null })
    const result = await calendar.get("e1")
    expect(calls.slice(0, 3)).toEqual([
      ["from", "calendar_events"],
      ["select", EVENT_COLUMNS],
      ["eq", "id", "e1"],
    ])
    expect(result).toMatchObject({
      ok: true,
      value: {
        id: "e1",
        link: { kind: "task", id: "t1", label: "Book the stall", ideaId: "i1" },
        attendees: [{ userId: "u1", rsvp: "going" }],
        myReminders: [60],
        defaultReminders: [60],
        timing: { allDay: false },
      },
    })
  })
})
