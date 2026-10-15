import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { MILESTONE_COLUMNS } from "./rows"
import { SupabaseMilestones } from "./supabase-milestones"

const row = {
  id: "m1",
  space_id: "s1",
  idea_id: "i1",
  title: "Open",
  target_date: "2026-12-01",
  completed_at: null,
  updated_at: "2026-10-15T10:00:00.123456+00:00",
}

const setup = (reply: Reply) => {
  const { calls, client } = recordingClient(reply)
  return { calls, milestones: new SupabaseMilestones(client as Db) }
}

describe("SupabaseMilestones", () => {
  it("lists an idea's milestones by target date, undated last", async () => {
    const { calls, milestones } = setup({ data: [row], error: null })
    const listed = await milestones.list("i1")
    expect(listed).toMatchObject({ ok: true, value: [{ id: "m1", updatedAt: row.updated_at }] })
    expect(calls).toEqual([
      ["from", "milestones"],
      ["select", MILESTONE_COLUMNS],
      ["eq", "idea_id", "i1"],
      ["order", "target_date", { nullsFirst: false }],
      ["order", "id"],
    ])
  })

  it("creates under its space and idea", async () => {
    const { calls, milestones } = setup({ data: row, error: null })
    const input = { spaceId: "s1", ideaId: "i1", title: "Open", targetDate: null }
    expect((await milestones.create(input)).ok).toBe(true)
    expect(calls[1]).toEqual([
      "insert",
      { space_id: "s1", idea_id: "i1", title: "Open", target_date: null },
    ])
  })

  it("updates only while updated_at is still the one the client saw", async () => {
    const { calls, milestones } = setup({ data: [{ ...row, title: "Launch" }], error: null })
    const updated = await milestones.update("m1", row.updated_at, { title: "Launch" })
    expect(updated).toMatchObject({ ok: true, value: { title: "Launch" } })
    expect(calls.slice(1)).toEqual([
      ["update", { title: "Launch" }],
      ["eq", "id", "m1"],
      ["eq", "updated_at", row.updated_at],
      ["select", MILESTONE_COLUMNS],
    ])
  })

  it("reads no row back as a conflict, with copy that says what to do", async () => {
    const { milestones } = setup({ data: [], error: null })
    const stale = await milestones.update("m1", row.updated_at, { completedAt: null })
    expect(stale).toEqual({
      ok: false,
      error: expect.objectContaining({
        kind: "conflict",
        message: "Someone else changed this. Reload to see their version",
      }),
    })
  })

  it("deletes by id and passes errors through", async () => {
    expect((await setup({ data: [{ id: "m1" }], error: null }).milestones.remove("m1")).ok).toBe(
      true,
    )
    const failed = await setup({ data: null, error: { message: "down" } }).milestones.list("i1")
    expect(failed.ok).toBe(false)
  })
})
