import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { ChecklistService } from "../application/checklist-service"
import { MilestonesService } from "../application/milestones-service"
import { TasksService } from "../application/tasks-service"
import { InMemoryChecklist, InMemoryMilestones } from "../testing/in-memory-plans"
import { anaAndBen, InMemoryTasks } from "../testing/in-memory-tasks"
import { tasksContext } from "./context"
import MilestonesPanel from "./MilestonesPanel.svelte"

const place = { spaceId: "s", ideaId: "i" }

async function setup() {
  const members = anaAndBen()
  const milestones = new MilestonesService(new InMemoryMilestones())
  const added = await milestones.add(place, { title: "Open", targetDate: null })
  if (!added.ok) throw new Error("add failed")
  const context = tasksContext({
    tasks: new TasksService(new InMemoryTasks(members), members),
    checklist: new ChecklistService(new InMemoryChecklist()),
    milestones,
  })
  render(MilestonesPanel, { props: { ...place, canDelete: () => true }, context })
  return { milestones, base: added.value }
}

afterEach(cleanup)

describe("MilestonesPanel", () => {
  it("shows the conflict copy and someone else's version after a lost race", async () => {
    const { milestones, base } = await setup()
    await screen.findByText("Open")
    await milestones.retarget(base, { title: "Theirs", targetDate: null })
    await fireEvent.click(screen.getByRole("button", { name: "Edit milestone Open" }))
    const form = screen.getByRole("form", { name: "Edit milestone" })
    const title = form.querySelector("input") as HTMLInputElement
    await fireEvent.input(title, { target: { value: "Mine" } })
    await fireEvent.submit(form)
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Someone else changed this. Reload to see their version",
    )
    expect(await screen.findByText("Theirs")).toBeInTheDocument()
  })
})
