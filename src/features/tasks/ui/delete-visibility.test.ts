import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { ChecklistService } from "../application/checklist-service"
import { MilestonesService } from "../application/milestones-service"
import { TasksService } from "../application/tasks-service"
import { InMemoryChecklist, InMemoryMilestones } from "../testing/in-memory-plans"
import { anaAndBen, InMemoryTasks } from "../testing/in-memory-tasks"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { provideTasks } from "./context"
import MilestonesPanel from "./MilestonesPanel.svelte"
import TasksTab from "./TasksTab.svelte"

const place = { spaceId: "s", ideaId: "i" }
const mineOnly = (createdBy: string | null) => createdBy === "ana"

async function setup(author: string) {
  const members = anaAndBen()
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
  const props = { ...place, ideaTitle: "Flat", canDelete: mineOnly }
  const provide = () => provideTasks(services)
  render(Provided, { props: { provide, component: TasksTab, props } })
  render(Provided, { props: { provide, component: MilestonesPanel, props } })
  await screen.findByText("Open")
  await screen.findByText("Sign")
}

/** The checklist item keeps its button; the milestone's waits in its editor; the task's in its menu. */
async function deletes() {
  const sign = screen.queryByRole("button", { name: "Remove Sign" })
  await fireEvent.click(screen.getByRole("button", { name: "Edit milestone Open" }))
  const milestone = screen.queryByRole("button", { name: "Delete milestone Open" })
  await fireEvent.keyDown(screen.getByRole("button", { name: "Actions for Lease" }), {
    key: "Enter",
  })
  await screen.findByRole("menu")
  return [screen.queryByRole("menuitem", { name: "Delete task" }), sign, milestone]
}

afterEach(cleanup)

describe("task, checklist and milestone delete buttons", () => {
  it("show for what the viewer may delete", async () => {
    await setup("ana")
    expect((await deletes()).every(Boolean)).toBe(true)
  })

  it("are hidden for someone else's work", async () => {
    await setup("ben")
    expect(await deletes()).toEqual([null, null, null])
  })
})
