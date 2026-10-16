import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { ITEM_COLUMNS } from "./rows"
import { SupabaseChecklist } from "./supabase-checklist"

const row = { id: "c1", task_id: "t1", label: "Sign", done: false, position: 0, created_by: "u1" }

const setup = (reply: Reply) => {
  const { calls, client } = recordingClient(reply)
  return { calls, checklist: new SupabaseChecklist(client as Db) }
}

describe("SupabaseChecklist", () => {
  it("lists a task's items in position order", async () => {
    const { calls, checklist } = setup({ data: [row], error: null })
    expect(await checklist.list("t1")).toEqual({
      ok: true,
      value: [{ id: "c1", taskId: "t1", label: "Sign", done: false, position: 0, createdBy: "u1" }],
    })
    expect(calls).toEqual([
      ["from", "task_checklist_items"],
      ["select", ITEM_COLUMNS],
      ["eq", "task_id", "t1"],
      ["order", "position"],
      ["order", "id"],
    ])
  })

  it("adds an item at its position and ticks it off", async () => {
    const added = setup({ data: row, error: null })
    await added.checklist.add({ spaceId: "s1", taskId: "t1", label: "Sign", position: 2 })
    expect(added.calls[1]).toEqual([
      "insert",
      { space_id: "s1", task_id: "t1", label: "Sign", position: 2 },
    ])
    const ticked = setup({ data: { ...row, done: true }, error: null })
    const result = await ticked.checklist.update("c1", { done: true })
    expect(result).toMatchObject({ ok: true, value: { done: true } })
    expect(ticked.calls.slice(1, 3)).toEqual([
      ["update", { done: true }],
      ["eq", "id", "c1"],
    ])
  })

  it("deletes by id", async () => {
    const { calls, checklist } = setup({ data: [{ id: "c1" }], error: null })
    expect((await checklist.remove("c1")).ok).toBe(true)
    expect(calls).toEqual([
      ["from", "task_checklist_items"],
      ["delete"],
      ["eq", "id", "c1"],
      ["select", "id"],
    ])
  })
})
