import { describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import { ChecklistService } from "../application/checklist-service"
import { MilestonesService } from "../application/milestones-service"
import { TasksService } from "../application/tasks-service"
import { InMemoryChecklist, InMemoryMilestones } from "../testing/in-memory-plans"
import { FakeMembers, InMemoryTasks } from "../testing/in-memory-tasks"
import { TasksState } from "./tasks-state.svelte"

const setup = () => {
  const members = new FakeMembers()
  const repository = new InMemoryTasks(members)
  const services = {
    tasks: new TasksService(repository, members),
    checklist: new ChecklistService(new InMemoryChecklist()),
    milestones: new MilestonesService(new InMemoryMilestones()),
  }
  return { repository, board: new TasksState(services, () => ({ spaceId: "s", ideaId: "i" })) }
}

describe("TasksState", () => {
  it("loads tasks with the members and milestones the pickers offer", async () => {
    const { board } = setup()
    await board.services.milestones.add(
      { spaceId: "s", ideaId: "i" },
      { title: "Open", targetDate: null },
    )
    await board.load()
    expect(board.members.map((member) => member.id)).toEqual(["ana", "ben"])
    expect(board.milestones.map((milestone) => milestone.title)).toEqual(["Open"])
    expect(board.list.loading).toBe(false)
  })

  it("adds new tasks on top, applies edits and removes", async () => {
    const { board } = setup()
    await board.load()
    expect(await board.create("Lease", null)).toBeNull()
    expect(await board.create(" ", null)).toMatchObject({ field: "title" })
    const id = board.list.items[0]!.id
    expect(await board.update(board.services.tasks.move(id, "done"))).toBeNull()
    expect(board.list.items[0]!.status).toBe("done")
    const refused = await board.update(board.services.tasks.assign(id, "stranger"))
    expect(refused).toMatchObject({ kind: "validation" })
    expect(await board.remove(id)).toBeNull()
    expect(board.list.items).toEqual([])
    expect(await board.remove(id)).toMatchObject({ kind: "not_found" })
  })

  it("keeps a load error on the list", async () => {
    const { repository, board } = setup()
    repository.list = async () => err(appError("network", "down"))
    await board.load()
    expect(board.list.error?.kind).toBe("network")
  })
})
