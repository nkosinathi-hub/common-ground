import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { SupabaseCalendar } from "./supabase-calendar"
import { write } from "./testing-rows"

const setup = (reply: Reply | Reply[]) => {
  const { calls, client } = recordingClient(reply)
  return { calls, calendar: new SupabaseCalendar(client as Db) }
}

describe("SupabaseCalendar writes", () => {
  it("creates and updates with snake case columns, one link at most", async () => {
    const { calls, calendar } = setup([
      { data: { id: "e9" }, error: null },
      { data: [{ id: "e9" }], error: null },
      { data: [], error: null },
    ])
    expect(await calendar.create("s1", write)).toEqual({ ok: true, value: "e9" })
    expect(calls[1]).toEqual([
      "insert",
      expect.objectContaining({
        space_id: "s1",
        title: "Movie night",
        all_day: false,
        starts_at: "2026-10-16T06:00:00.000Z",
        start_date: null,
        idea_id: "i1",
        watch_item_id: null,
        task_id: null,
        default_reminders: [60],
      }),
    ])
    expect(await calendar.update("e9", write)).toEqual({ ok: true, value: undefined })
    expect(await calendar.update("e9", write)).toMatchObject({
      ok: false,
      error: { kind: "not_found" },
    })
  })

  it("calls the attendee, rsvp and reminder RPCs and reads refused deletes", async () => {
    const { calls, calendar } = setup({ data: null, error: null })
    await calendar.setAttendees("e1", ["u2"])
    await calendar.rsvp("e1", "maybe")
    await calendar.setMyReminders("e1", [10])
    expect(calls).toEqual([
      ["rpc", "set_event_attendees", { event: "e1", members: ["u2"] }],
      ["rpc", "rsvp_event", { event: "e1", response: "maybe" }],
      ["rpc", "set_my_event_reminders", { event: "e1", minutes: [10] }],
    ])
    expect(await setup({ data: [], error: null }).calendar.remove("e1")).toMatchObject({
      ok: false,
      error: { kind: "denied" },
    })
    expect((await setup({ data: null, error: { code: "42501" } }).calendar.get("e1")).ok).toBe(
      false,
    )
  })
})
