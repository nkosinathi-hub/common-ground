import { afterEach, describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import {
  formatDue,
  groupByStatus,
  isOverdue,
  TASK_STATUSES,
  validateTaskInput,
  type Task,
} from "./task"

const task = (id: string, status: Task["status"], dueDate: string | null = null): Task => ({
  id,
  spaceId: "s",
  ideaId: "i",
  title: id,
  description: "",
  status,
  priority: "medium",
  dueDate: dueDate as DateOnly | null,
  assigneeId: null,
  milestoneId: null,
  createdAt: "",
  updatedAt: "",
})
const zone = process.env.TZ

describe("task", () => {
  afterEach(() => {
    process.env.TZ = zone
  })

  it("has backlog, to-do, in-progress and done columns in order", () => {
    expect(TASK_STATUSES).toEqual(["backlog", "todo", "in_progress", "done"])
    const board = groupByStatus([task("a", "done"), task("b", "todo")])
    expect(board.map((c) => c.tasks.map((t) => t.id))).toEqual([[], ["b"], [], ["a"]])
  })

  it("validates title and a date-only due date", () => {
    expect(validateTaskInput({ title: " Lease ", dueDate: "2026-10-15" }).ok).toBe(true)
    expect(validateTaskInput({ title: "", dueDate: null }).ok).toBe(false)
    const bad = validateTaskInput({ title: "x", dueDate: "2026-02-30" })
    expect(bad.ok ? null : bad.error.field).toBe("dueDate")
  })

  // Switching TZ makes Node reload ICU zone data, which can take seconds on a loaded machine.
  it.each(["Pacific/Auckland", "America/Los_Angeles", "UTC"])(
    "shows the same due day in %s",
    (tz) => {
      process.env.TZ = tz
      expect(formatDue("2026-10-15" as DateOnly)).toBe("15 Oct 2026")
    },
    30_000,
  )

  it("is overdue only after the due day and never when done", () => {
    const today = "2026-10-15" as DateOnly
    expect(isOverdue(task("a", "todo", "2026-10-14"), today)).toBe(true)
    expect(isOverdue(task("b", "todo", "2026-10-15"), today)).toBe(false)
    expect(isOverdue(task("c", "done", "2026-10-01"), today)).toBe(false)
    expect(isOverdue(task("d", "todo"), today)).toBe(false)
  })
})
