import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import { dueState, sortUpcoming, type UpcomingTask } from "./upcoming"

const today = "2026-10-15" as DateOnly
const task = (id: string, dueDate: string): UpcomingTask => ({
  id,
  ideaId: "i",
  ideaTitle: "Tea bar",
  title: id,
  status: "todo",
  dueDate: dueDate as DateOnly,
})

describe("upcoming tasks", () => {
  it("classifies against the local calendar day", () => {
    expect(dueState("2026-10-14" as DateOnly, today)).toBe("overdue")
    expect(dueState("2026-10-15" as DateOnly, today)).toBe("today")
    expect(dueState("2026-10-16" as DateOnly, today)).toBe("soon")
  })

  it("orders by due date so overdue comes first, then by title", () => {
    const sorted = sortUpcoming([
      task("b", "2026-10-20"),
      task("c", "2026-10-01"),
      task("a", "2026-10-20"),
    ])
    expect(sorted.map((t) => t.id)).toEqual(["c", "a", "b"])
  })
})
