import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { ChecklistService } from "../application/checklist-service"
import { MilestonesService } from "../application/milestones-service"
import { TasksService } from "../application/tasks-service"
import { InMemoryChecklist, InMemoryMilestones } from "../testing/in-memory-plans"
import { FakeMembers, InMemoryTasks } from "../testing/in-memory-tasks"
import { tasksContext } from "./context"
import MilestonesPanel from "./MilestonesPanel.svelte"
import TasksTab from "./TasksTab.svelte"

const place = { spaceId: "s", ideaId: "i" }
const mineOnly = (createdBy: string | null) => createdBy === "ana"

async function setup(author: string) {
  const members = new FakeMembers()
  const repos = {
    tasks: new InMemoryTasks(members),
    checklist: new InMemoryChecklist(),
    milestones: new InMemoryMilestones(),
  }
  for (const repo of Object.values(repos)) repo.author = author
  const services = {
    tasks: new TasksService(repos.tasks, members),
    checklist: new ChecklistService(repos.checklist),
    milestones: new MilestonesService(repos.milestones),
  }
  const task = await services.tasks.create(place, { title: "Lease", dueDate: null })
  if (!task.ok) throw new Error("create failed")
  await services.checklist.add(task.value, "Sign", [])
  await services.milestones.add(place, { title: "Open", targetDate: null })
  const context = tasksContext(services)
  render(TasksTab, { props: { ...place, canDelete: mineOnly }, context })
  render(MilestonesPanel, { props: { ...place, canDelete: mineOnly }, context })
  await screen.findByText("Open")
  await fireEvent.click(await screen.findByRole("button", { name: "Checklist" }))
  await screen.findByText("Sign")
}

const deletes = () =>
  ["Delete task Lease", "Remove Sign", "Delete milestone Open"].map((name) =>
    screen.queryByRole("button", { name }),
  )

afterEach(cleanup)

describe("task, checklist and milestone delete buttons", () => {
  it("show for what the viewer may delete", async () => {
    await setup("ana")
    expect(deletes().every(Boolean)).toBe(true)
  })

  it("are hidden for someone else's work", async () => {
    await setup("ben")
    expect(deletes()).toEqual([null, null, null])
  })
})
