import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { inMemoryIdeasService } from "../testing/ideas-fixture"
import { provideIdeas } from "./context"
import IdeasInProgress from "./IdeasInProgress.svelte"

function show(service: ReturnType<typeof inMemoryIdeasService>["service"]) {
  const props = { spaceId: "s", ideaHref: (id: string) => `#/idea/${id}` }
  render(Provided, {
    props: { provide: () => provideIdeas({ service }), component: IdeasInProgress, props },
  })
}

afterEach(cleanup)

describe("IdeasInProgress", () => {
  it("links each idea in progress with its stage", async () => {
    const { service } = inMemoryIdeasService()
    const made = await service.capture({ spaceId: "s", title: "Tea bar" })
    if (!made.ok) throw new Error("capture failed")
    await service.moveStage(made.value.id, "planning")
    show(service)
    const link = await screen.findByRole("link", { name: /Tea bar/ })
    expect(link).toHaveAttribute("href", `#/idea/${made.value.id}`)
    expect(link).toHaveTextContent("Planning")
  })

  it("says when nothing is in progress", async () => {
    const { service } = inMemoryIdeasService()
    await service.capture({ spaceId: "s", title: "Still in the inbox" })
    show(service)
    expect(await screen.findByText("Nothing in progress")).toBeInTheDocument()
  })
})
