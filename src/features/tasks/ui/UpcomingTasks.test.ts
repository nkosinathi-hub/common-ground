import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { ChecklistService } from "../application/checklist-service"
import { MilestonesService } from "../application/milestones-service"
import { TasksService } from "../application/tasks-service"
import { InMemoryChecklist, InMemoryMilestones } from "../testing/in-memory-plans"
import { anaAndBen, InMemoryTasks } from "../testing/in-memory-tasks"
import { provideTasks } from "./context"
import UpcomingTasks from "./UpcomingTasks.svelte"

afterEach(cleanup)

describe("UpcomingTasks", () => {
  it("lists due tasks without a heading of its own, since the Home card titles it", async () => {
    const members = anaAndBen()
    const tasks = new TasksService(new InMemoryTasks(members), members)
    await tasks.create({ spaceId: "s", ideaId: "i" }, { title: "Lease", dueDate: "2099-01-05" })
    const services = {
      tasks,
      checklist: new ChecklistService(new InMemoryChecklist()),
      milestones: new MilestonesService(new InMemoryMilestones()),
    }
    const props = { spaceId: "s", taskHref: (ideaId: string) => `#/${ideaId}` }
    render(Provided, {
      props: { provide: () => provideTasks(services), component: UpcomingTasks, props },
    })
    expect(await screen.findByRole("link", { name: /Lease/ })).toHaveAttribute("href", "#/i")
    expect(screen.queryByRole("heading")).toBeNull()
  })
})
