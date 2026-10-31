import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { inMemoryIdeasService } from "../testing/ideas-fixture"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { provideIdeas } from "./context"
import IdeasPage from "./IdeasPage.svelte"

async function setup() {
  const { repo, people, service } = inMemoryIdeasService()
  for (const [author, title] of [
    ["ben", "Ben's zine"],
    ["ana", "Ana's tea"],
    ["ben", "Our garden"],
  ]) {
    repo.author = author!
    await service.capture({ spaceId: "s", title: title! })
  }
  const garden = [...repo.rows.values()].find((idea) => idea.title === "Our garden")!
  people.me = "ben"
  await service.invite(garden.id, ["ana"])
  people.me = "ana"
  await service.respond(garden.id, true)
  const props = { spaceId: "s", me: "ana", ideaHref: () => "#" }
  render(Provided, {
    props: { provide: () => provideIdeas({ service }), component: IdeasPage, props },
  })
  await screen.findByText("Ben's zine")
}

const titles = () =>
  screen.getAllByTestId("idea-card").map((card) => card.querySelector("a")?.textContent)

afterEach(cleanup)

describe("IdeasPage whose filter", () => {
  it("narrows to the viewer's ideas, or to every idea they are on", async () => {
    await setup()
    await fireEvent.click(screen.getByRole("radio", { name: "Mine" }))
    await screen.findByText("Ana's tea")
    expect(titles()).toEqual(["Ana's tea"])
    await fireEvent.click(screen.getByRole("radio", { name: "Ours" }))
    expect(await screen.findByText("Our garden")).toBeInTheDocument()
    expect(titles()).toEqual(["Our garden", "Ana's tea"])
    cleanup()
  })

  it("says nothing matches when the server finds none of the viewer's ideas", async () => {
    const { service } = inMemoryIdeasService()
    const props = { spaceId: "s", me: "cy", ideaHref: () => "#" }
    render(Provided, {
      props: { provide: () => provideIdeas({ service }), component: IdeasPage, props },
    })
    await screen.findByText("No ideas yet")
    await fireEvent.click(screen.getByRole("radio", { name: "Mine" }))
    expect(await screen.findByText("No ideas match these filters.")).toBeInTheDocument()
  })
})
