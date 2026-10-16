import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { TASK_COLUMNS, UPCOMING_COLUMNS } from "./rows"
import { SupabaseTasks } from "./supabase-tasks"

const row = {
  id: "t1",
  space_id: "s1",
  idea_id: "i1",
  title: "Lease",
  description: "",
  status: "todo",
  priority: "high",
  due_date: "2026-10-20",
  assignee_id: null,
  milestone_id: null,
  created_by: "u1",
  created_at: "2026-10-15T10:00:00Z",
  updated_at: "2026-10-15T10:00:00Z",
}

const setup = (reply: Reply) => {
  const { calls, client } = recordingClient(reply)
  return { calls, tasks: new SupabaseTasks(client as Db) }
}

describe("SupabaseTasks", () => {
  it("lists an idea's tasks newest first and maps them", async () => {
    const { calls, tasks } = setup({ data: [row], error: null })
    const page = await tasks.list("i1", null)
    expect(page).toMatchObject({
      ok: true,
      value: {
        items: [
          { id: "t1", ideaId: "i1", dueDate: "2026-10-20", priority: "high", createdBy: "u1" },
        ],
      },
    })
    expect(calls.slice(0, 3)).toEqual([
      ["from", "tasks"],
      ["select", TASK_COLUMNS],
      ["eq", "idea_id", "i1"],
    ])
    expect(calls.at(-1)).toEqual(["limit", 51])
  })

  it("creates under its space and idea", async () => {
    const { calls, tasks } = setup({ data: row, error: null })
    const input = { spaceId: "s1", ideaId: "i1", title: "Lease", dueDate: null }
    expect(await tasks.create(input)).toMatchObject({ ok: true, value: { title: "Lease" } })
    expect(calls[1]).toEqual([
      "insert",
      { space_id: "s1", idea_id: "i1", title: "Lease", due_date: null },
    ])
  })

  it("updates only the patched columns, in snake case", async () => {
    const { calls, tasks } = setup({ data: { ...row, assignee_id: "u2" }, error: null })
    const updated = await tasks.update("t1", { assigneeId: "u2", dueDate: null })
    expect(updated).toMatchObject({ ok: true, value: { assigneeId: "u2" } })
    expect(calls.slice(1, 3)).toEqual([
      ["update", { assignee_id: "u2", due_date: null }],
      ["eq", "id", "t1"],
    ])
  })

  it("lists open dated tasks soonest first with their idea title", async () => {
    const upcomingRow = { ...row, ideas: { title: "Tea bar" } }
    const { calls, tasks } = setup({
      data: [upcomingRow, { ...upcomingRow, ideas: null }],
      error: null,
    })
    const upcoming = await tasks.upcoming("s1", 8)
    expect(upcoming.ok && upcoming.value.map((task) => task.ideaTitle)).toEqual(["Tea bar", ""])
    expect(calls).toEqual([
      ["from", "tasks"],
      ["select", UPCOMING_COLUMNS],
      ["eq", "space_id", "s1"],
      ["neq", "status", "done"],
      ["not", "due_date", "is", null],
      ["order", "due_date"],
      ["order", "title"],
      ["limit", 8],
    ])
  })

  it("reads an RLS-filtered delete as refused and passes errors through", async () => {
    expect(await setup({ data: [{ id: "t1" }], error: null }).tasks.remove("t1")).toEqual({
      ok: true,
      value: undefined,
    })
    expect(await setup({ data: [], error: null }).tasks.remove("t1")).toMatchObject({
      ok: false,
      error: { kind: "denied" },
    })
    const failed = await setup({ data: null, error: { message: "down" } }).tasks.list("i1", null)
    expect(failed.ok).toBe(false)
  })
})
