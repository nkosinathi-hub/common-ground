import { describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import { makeTasksUseCases } from "../application/tasks-use-cases"
import { InMemoryChecklist, InMemoryMilestones } from "../testing/in-memory-plans"
import { FakeMembers, InMemoryTasks } from "../testing/in-memory-tasks"
import { TasksState } from "./tasks-state.svelte"

const setup = () => {
  const members = new FakeMembers()
  const tasks = new InMemoryTasks(members)
  const uc = makeTasksUseCases({
    tasks,
    checklist: new InMemoryChecklist(),
    milestones: new InMemoryMilestones(),
    members,
  })
  return { tasks, board: new TasksState(uc, () => ({ spaceId: "s", ideaId: "i" })) }
}

describe("TasksState", () => {
  it("loads tasks with members and milestones, applies writes and removes", async () => {
    const { board } = setup()
    await board.load()
    expect(board.members).toHaveLength(2)
    expect(
      await board.apply(board.uc.create("s", "i", { title: "Lease", dueDate: null })),
    ).toBeNull()
    const id = board.items[0]!.id
    expect(await board.apply(board.uc.move(id, "done"))).toBeNull()
    expect(board.items[0]!.status).toBe("done")
    expect(await board.apply(board.uc.assign(id, "stranger"))).toMatchObject({ kind: "validation" })
    expect(await board.remove(id)).toBeNull()
    expect(await board.remove(id)).toMatchObject({ kind: "not_found" })
    await board.load(true)
    expect(board.items).toEqual([])
  })

  it("keeps a load error", async () => {
    const { tasks, board } = setup()
    tasks.list = async () => err(appError("network", "down"))
    await board.load()
    expect(board.error?.kind).toBe("network")
  })
})
