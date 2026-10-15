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

describe("tasks use cases, edges", () => {
  it("validates create and rename, describes, lists and removes", async () => {
    const uc = setup()
    expect((await uc.create("s", "i", { title: " ", dueDate: null })).ok).toBe(false)
    const task = await uc.create("s", "i", { title: "Lease", dueDate: null })
    if (!task.ok) throw new Error("create failed")
    expect((await uc.rename(task.value.id, "")).ok).toBe(false)
    const renamed = await uc.rename(task.value.id, " Sign lease ")
    expect(renamed.ok && renamed.value.title).toBe("Sign lease")
    const described = await uc.describe(task.value.id, " Before Friday ")
    expect(described.ok && described.value.description).toBe("Before Friday")
    const page = await uc.list("i", null)
    expect(page.ok && page.value.items).toHaveLength(1)
    expect((await uc.remove(task.value.id)).ok).toBe(true)
    expect((await uc.members("s")).ok).toBe(true)
  })

  it("removes checklist items and milestones, retargets and reopens", async () => {
    const uc = setup()
    const item = await uc.addItem("s", "t", "Sign", [])
    if (!item.ok) throw new Error("add failed")
    expect((await uc.removeItem(item.value.id)).ok).toBe(true)
    expect((await uc.addMilestone("s", "i", { title: "", targetDate: null })).ok).toBe(false)
    const ms = await uc.addMilestone("s", "i", { title: "Open", targetDate: null })
    if (!ms.ok) throw new Error("milestone failed")
    const moved = await uc.retargetMilestone(ms.value.id, {
      title: "Open",
      targetDate: "2027-01-01",
    })
    expect(moved.ok && moved.value.targetDate).toBe("2027-01-01")
    const reopened = await uc.completeMilestone(ms.value.id, false)
    expect(reopened.ok && reopened.value.completedAt).toBeNull()
    expect((await uc.milestones("i")).ok).toBe(true)
    expect((await uc.removeMilestone(ms.value.id)).ok).toBe(true)
  })
})
