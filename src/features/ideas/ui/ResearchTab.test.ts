import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { ResearchService } from "../application/research-service"
import type { Idea } from "../domain"
import { inMemoryIdeasService } from "../testing/ideas-fixture"
import { inMemoryResearch } from "../testing/in-memory-research"
import { ideasContext } from "./context"
import ResearchTab from "./ResearchTab.svelte"

const idea = { id: "i", spaceId: "s", title: "Tea" } as Idea
const link = { url: "https://tea.dev", title: "Tea", description: "" }

async function setup(viewer: { me: string; isOwner: boolean }) {
  const research = new ResearchService(inMemoryResearch("u1"))
  await research.addNote("s", "i", "Call the roaster")
  await research.addLink("s", "i", link)
  await research.addHypothesis("s", "i", "People pay")
  const context = ideasContext(inMemoryIdeasService().service, research)
  render(ResearchTab, { props: { idea, viewer }, context })
  await screen.findByText("Call the roaster")
  await screen.findByText("People pay")
}

const deletes = () => [
  screen.queryByRole("button", { name: "Delete note" }),
  screen.queryByRole("button", { name: "Delete link Tea" }),
  screen.queryByRole("button", { name: "Delete hypothesis" }),
]

afterEach(cleanup)

describe("ResearchTab delete buttons", () => {
  it("are hidden from a member who did not write the item", async () => {
    await setup({ me: "u2", isOwner: false })
    expect(deletes()).toEqual([null, null, null])
  })

  it("are shown to the author and to the space owner", async () => {
    await setup({ me: "u1", isOwner: false })
    expect(deletes().every(Boolean)).toBe(true)
    cleanup()
    await setup({ me: "u3", isOwner: true })
    expect(deletes().every(Boolean)).toBe(true)
  })
})
