import { describe, expect, it } from "vitest"
import { InMemoryChecklist, InMemoryMilestones } from "../testing/in-memory-plans"
import { FakeMembers, InMemoryTasks } from "../testing/in-memory-tasks"
import { makeTasksUseCases } from "./tasks-use-cases"

describe("upcoming use case", () => {
  it("lists open tasks with a due date in the space, soonest first, at most 8", async () => {
    const members = new FakeMembers()
    const tasks = new InMemoryTasks(members)
    const uc = makeTasksUseCases({
      tasks,
      checklist: new InMemoryChecklist(),
      milestones: new InMemoryMilestones(),
      members,
    })
    for (let day = 20; day > 9; day--)
      await uc.create("s", "i", { title: `T${day}`, dueDate: `2026-10-${day}` })
    await uc.create("s", "i", { title: "No date", dueDate: null })
    await uc.create("other", "j", { title: "Elsewhere", dueDate: "2026-10-01" })
    const done = await uc.create("s", "i", { title: "Done", dueDate: "2026-10-02" })
    if (done.ok) await uc.move(done.value.id, "done")

    const result = await uc.upcoming("s")
    expect(result.ok && result.value.map((t) => t.title)).toEqual([
      "T10",
      "T11",
      "T12",
      "T13",
      "T14",
      "T15",
      "T16",
      "T17",
    ])
  })
})
