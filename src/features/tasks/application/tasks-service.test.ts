import { describe, expect, it } from "vitest"
import { anaAndBen, InMemoryTasks } from "../testing/in-memory-tasks"
import { TasksService } from "./tasks-service"

const place = { spaceId: "s", ideaId: "i" }

const setup = () => {
  const members = anaAndBen()
  return new TasksService(new InMemoryTasks(members), members)
}

const created = async (service: TasksService) => {
  const task = await service.create(place, { title: "Lease", dueDate: "2026-10-15" })
  if (!task.ok) throw new Error("create failed")
  return task.value
}

describe("TasksService", () => {
  it("creates in the backlog with a date-only due date", async () => {
    const task = await created(setup())
    expect(task).toMatchObject({ status: "backlog", priority: "medium", dueDate: "2026-10-15" })
  })

  it("refuses a blank title on create and rename, and trims what it keeps", async () => {
    const service = setup()
    expect((await service.create(place, { title: " ", dueDate: null })).ok).toBe(false)
    const task = await created(service)
    expect((await service.rename(task.id, "")).ok).toBe(false)
    const renamed = await service.rename(task.id, " Sign lease ")
    expect(renamed.ok && renamed.value.title).toBe("Sign lease")
    const described = await service.describe(task.id, " Before Friday ")
    expect(described.ok && described.value.description).toBe("Before Friday")
  })

  it("moves, prioritizes, assigns a member and refuses a non-member", async () => {
    const service = setup()
    const task = await created(service)
    await service.move(task.id, "in_progress")
    await service.prioritize(task.id, "urgent")
    const assigned = await service.assign(task.id, "ben")
    expect(assigned.ok && assigned.value).toMatchObject({
      status: "in_progress",
      priority: "urgent",
      assigneeId: "ben",
    })
    expect((await service.assign(task.id, "stranger")).ok).toBe(false)
  })

  it("sets, rejects and clears a due date", async () => {
    const service = setup()
    const task = await created(service)
    const moved = await service.setDue(task.id, "2026-11-01")
    expect(moved.ok && moved.value.dueDate).toBe("2026-11-01")
    const bad = await service.setDue(task.id, "2026-13-01")
    expect(bad.ok ? null : bad.error.field).toBe("dueDate")
    const cleared = await service.setDue(task.id, null)
    expect(cleared.ok && cleared.value.dueDate).toBeNull()
  })

  it("links and unlinks a milestone, lists, lists members and removes", async () => {
    const service = setup()
    const task = await created(service)
    const linked = await service.linkMilestone(task.id, "ms-1")
    expect(linked.ok && linked.value.milestoneId).toBe("ms-1")
    const unlinked = await service.linkMilestone(task.id, null)
    expect(unlinked.ok && unlinked.value.milestoneId).toBeNull()
    const page = await service.list("i", null)
    expect(page.ok && page.value.items).toHaveLength(1)
    const members = await service.members("s")
    expect(members.ok && members.value.map((member) => member.displayName)).toEqual(["Ana", "Ben"])
    expect((await service.remove(task.id)).ok).toBe(true)
  })
})
