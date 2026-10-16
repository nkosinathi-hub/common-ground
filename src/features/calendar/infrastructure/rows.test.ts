import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { SupabaseCalendar } from "./supabase-calendar"
import { eventRow } from "./testing-rows"

const setup = (reply: Reply) => ({
  calendar: new SupabaseCalendar(recordingClient(reply).client as Db),
})

describe("event rows", () => {
  it("maps all-day events, watch and idea links", async () => {
    const allDay = eventRow({
      all_day: true,
      starts_at: null,
      ends_at: null,
      start_date: "2026-10-16",
      end_date: "2026-10-18",
      task_id: null,
      tasks: null,
      watch_item_id: "w1",
      watch_items: { title: "Dune" },
    })
    const result = await setup({ data: allDay, error: null }).calendar.get("e1")
    expect(result).toMatchObject({
      ok: true,
      value: {
        timing: { allDay: true, startDate: "2026-10-16", endDate: "2026-10-18" },
        link: { kind: "watch_item", label: "Dune" },
      },
    })
    const idea = eventRow({
      task_id: null,
      tasks: null,
      idea_id: "i1",
      ideas: { title: "Tea bar" },
    })
    expect(await setup({ data: idea, error: null }).calendar.get("e1")).toMatchObject({
      ok: true,
      value: { link: { kind: "idea", ideaId: "i1", label: "Tea bar" } },
    })
    const none = eventRow({ task_id: null, tasks: null })
    expect(await setup({ data: none, error: null }).calendar.get("e1")).toMatchObject({
      ok: true,
      value: { link: null },
    })
  })
})
