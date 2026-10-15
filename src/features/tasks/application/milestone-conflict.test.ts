import { describe, expect, it } from "vitest"
import { InMemoryChecklist, InMemoryMilestones } from "../testing/in-memory-plans"
import { FakeMembers, InMemoryTasks } from "../testing/in-memory-tasks"
import { makeTasksUseCases } from "./tasks-use-cases"

const setup = () => {
  const members = new FakeMembers()
  const milestones = new InMemoryMilestones()
  const tasks = makeTasksUseCases({
    tasks: new InMemoryTasks(members),
    checklist: new InMemoryChecklist(),
    milestones,
    members,
  })
  return { tasks, milestones }
}

async function added(tasks: ReturnType<typeof setup>["tasks"]) {
  const ms = await tasks.addMilestone("s", "i", { title: "Open", targetDate: null })
  if (!ms.ok) throw new Error("milestone failed")
  return ms.value
}

describe("milestone edits check the version the client saw", () => {
  it("carries updatedAt and moves it forward on each edit", async () => {
    const { tasks } = setup()
    const base = await added(tasks)
    expect(base.updatedAt).not.toBe("")
    const edited = await tasks.retargetMilestone(base, {
      title: "Launch",
      targetDate: "2027-01-01",
    })
    expect(edited.ok && edited.value).toMatchObject({ title: "Launch", targetDate: "2027-01-01" })
    expect(edited.ok && edited.value.updatedAt).not.toBe(base.updatedAt)
  })

  it("refuses an edit made from a stale copy with a conflict", async () => {
    const { tasks } = setup()
    const base = await added(tasks)
    const first = await tasks.completeMilestone(base, true, new Date("2026-10-15T08:00:00Z"))
    expect(first.ok).toBe(true)
    const stale = await tasks.retargetMilestone(base, { title: "Mine", targetDate: null })
    expect(stale.ok ? null : stale.error.kind).toBe("conflict")
    const reopen = await tasks.completeMilestone(base, false)
    expect(reopen.ok ? null : reopen.error.kind).toBe("conflict")
  })

  it("validates before it writes", async () => {
    const { tasks } = setup()
    const base = await added(tasks)
    const bad = await tasks.retargetMilestone(base, { title: "Open", targetDate: "bad" })
    expect(bad.ok ? null : bad.error.field).toBe("targetDate")
  })
})
