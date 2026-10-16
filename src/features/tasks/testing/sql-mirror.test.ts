import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import type { UpcomingTask } from "../domain"
import { sortUpcoming } from "./sql-mirror"

const task = (id: string, dueDate: string): UpcomingTask => ({
  id,
  ideaId: "i",
  ideaTitle: "Tea bar",
  title: id,
  status: "todo",
  dueDate: dueDate as DateOnly,
})

describe("sortUpcoming", () => {
  it("orders by due date so overdue comes first, then by title", () => {
    const sorted = sortUpcoming([
      task("b", "2026-10-20"),
      task("c", "2026-10-01"),
      task("a", "2026-10-20"),
    ])
    expect(sorted.map((t) => t.id)).toEqual(["c", "a", "b"])
  })
})
