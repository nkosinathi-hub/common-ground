import { describe, expect, it } from "vitest"
import { anaAndBen, InMemoryTasks } from "../testing/in-memory-tasks"
import { TasksService } from "./tasks-service"

const here = { spaceId: "s", ideaId: "i" }

describe("upcoming tasks", () => {
  it("lists open tasks with a due date in the space, soonest first, at most 8", async () => {
    const members = anaAndBen()
    const tasks = new InMemoryTasks(members)
    const service = new TasksService(tasks, members)
    for (let day = 20; day > 9; day--)
      await service.create(here, { title: `T${day}`, dueDate: `2026-10-${day}` })
    await service.create(here, { title: "No date", dueDate: null })
    await service.create(
      { spaceId: "other", ideaId: "j" },
      { title: "Elsewhere", dueDate: "2026-10-01" },
    )
    const done = await service.create(here, { title: "Done", dueDate: "2026-10-02" })
    if (done.ok) await service.move(done.value.id, "done")

    const result = await service.upcoming("s")
    expect(result.ok && result.value.map((task) => task.title)).toEqual([
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
