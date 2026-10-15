import { describe, expect, it } from "vitest"
import { InMemoryChecklist, InMemoryMilestones } from "../testing/in-memory-plans"
import { FakeMembers, InMemoryTasks } from "../testing/in-memory-tasks"
import { makeTasksUseCases } from "./tasks-use-cases"

const setup = () => {
  const members = new FakeMembers()
  return makeTasksUseCases({
    tasks: new InMemoryTasks(members),
    checklist: new InMemoryChecklist(),
    milestones: new InMemoryMilestones(),
    members,
  })
}

const created = async (uc: ReturnType<typeof setup>) => {
  const task = await uc.create("s", "i", { title: "Lease", dueDate: "2026-10-15" })
  if (!task.ok) throw new Error("create failed")
  return task.value
}

describe("tasks use cases", () => {
  it("creates in the backlog with a date-only due date", async () => {
    const task = await created(setup())
    expect(task).toMatchObject({ status: "backlog", priority: "medium", dueDate: "2026-10-15" })
  })

  it("moves, prioritizes, assigns a member and refuses a non-member", async () => {
    const uc = setup()
    const task = await created(uc)
    await uc.move(task.id, "in_progress")
    await uc.prioritize(task.id, "urgent")
    const assigned = await uc.assign(task.id, "ben")
    expect(assigned.ok && assigned.value).toMatchObject({
      status: "in_progress",
      priority: "urgent",
      assigneeId: "ben",
    })
    expect((await uc.assign(task.id, "stranger")).ok).toBe(false)
    expect((await uc.setDue(task.id, "2026-13-01")).ok).toBe(false)
    const cleared = await uc.setDue(task.id, null)
    expect(cleared.ok && cleared.value.dueDate).toBeNull()
  })

  it("keeps checklist items in order and toggles them", async () => {
    const uc = setup()
    const task = await created(uc)
    const first = await uc.addItem("s", task.id, "Sign", [])
    if (!first.ok) throw new Error("add failed")
    await uc.addItem("s", task.id, "Pay deposit", [first.value])
    await uc.toggleItem(first.value.id, true)
    const items = await uc.checklist(task.id)
    expect(items.ok && items.value.map((i) => [i.label, i.done])).toEqual([
      ["Sign", true],
      ["Pay deposit", false],
    ])
    expect((await uc.addItem("s", task.id, " ", [])).ok).toBe(false)
  })

  it("links an optional milestone and completes it", async () => {
    const uc = setup()
    const task = await created(uc)
    const ms = await uc.addMilestone("s", "i", { title: "Open", targetDate: "2026-12-01" })
    if (!ms.ok) throw new Error("milestone failed")
    const linked = await uc.linkMilestone(task.id, ms.value.id)
    expect(linked.ok && linked.value.milestoneId).toBe(ms.value.id)
    const done = await uc.completeMilestone(ms.value.id, true, new Date("2026-10-15T08:00:00Z"))
    expect(done.ok && done.value.completedAt).toBe("2026-10-15T08:00:00.000Z")
    expect((await uc.retargetMilestone(ms.value.id, { title: "Open", targetDate: "bad" })).ok).toBe(
      false,
    )
  })
})
