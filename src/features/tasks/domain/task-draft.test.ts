import { describe, expect, it } from "vitest"
import { filterTasks, tasksSummary, validateTaskDraft } from "./task-draft"
import type { Task } from "./task"

const draft = {
  title: " Compare two campsites ",
  description: " Find a quiet spot. ",
  status: "todo",
  priority: "medium",
  dueDate: "2026-10-27",
  assigneeId: "ben",
  milestoneId: null,
} as const

const task = (over: Partial<Task>): Task =>
  ({
    id: "t",
    status: "todo",
    priority: "medium",
    assigneeId: null,
    milestoneId: null,
    ...over,
  }) as Task

describe("task drafts", () => {
  it("trims and keeps every field the editor saves at once", () => {
    expect(validateTaskDraft(draft)).toEqual({
      ok: true,
      value: { ...draft, title: "Compare two campsites", description: "Find a quiet spot." },
    })
  })

  it("names the field that is wrong", () => {
    const blank = validateTaskDraft({ ...draft, title: " " })
    expect(!blank.ok && blank.error.field).toBe("title")
    const long = validateTaskDraft({ ...draft, description: "x".repeat(4001) })
    expect(!long.ok && long.error.field).toBe("description")
    const date = validateTaskDraft({ ...draft, dueDate: "27/10" })
    expect(!date.ok && date.error.field).toBe("dueDate")
  })
})

describe("task filters", () => {
  it("narrows by assignee, priority and milestone, and counts what is done", () => {
    const tasks = [
      task({ id: "a", assigneeId: "ben", priority: "high" }),
      task({ id: "b", assigneeId: "ana", status: "done", milestoneId: "m" }),
    ]
    expect(filterTasks(tasks, { assignee: "ben" }).map((t) => t.id)).toEqual(["a"])
    expect(filterTasks(tasks, { milestone: "m" }).map((t) => t.id)).toEqual(["b"])
    expect(filterTasks(tasks, { priority: "low" })).toEqual([])
    expect(tasksSummary(tasks)).toBe("2 tasks · 1 done")
    expect(tasksSummary(tasks.slice(0, 1))).toBe("1 task · 0 done")
  })
})
