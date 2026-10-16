import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { buildHash } from "@/shared/domain"
import { IdeasService } from "../application/ideas-service"
import { InMemoryIdeas } from "../testing/in-memory-ideas"
import { ideasContext } from "./context"
import IdeaDetail from "./IdeaDetail.svelte"

async function setup(spaceId: string) {
  const service = new IdeasService(new InMemoryIdeas())
  const created = await service.capture({ spaceId: "space-a", title: "Tea bar" })
  if (!created.ok) throw new Error("capture failed")
  const viewer = { me: "u1", isOwner: true }
  const props = {
    spaceId,
    ideaId: created.value.id,
    tab: "overview" as const,
    tabHref: () => "#",
    viewer,
  }
  render(IdeaDetail, { props, context: ideasContext(service) })
}

afterEach(() => {
  cleanup()
  window.location.hash = ""
})

describe("IdeaDetail", () => {
  it("goes back to the space's ideas list once the idea is deleted", async () => {
    await setup("space-a")
    await fireEvent.click(await screen.findByRole("button", { name: "Delete idea" }))
    const dialog = within(await screen.findByRole("alertdialog"))
    await fireEvent.click(dialog.getByRole("button", { name: "Delete" }))
    const list = buildHash({ name: "ideas", spaceId: "space-a" })
    await waitFor(() => expect(window.location.hash).toBe(list))
  })

  it("refuses to show an idea under another space", async () => {
    await setup("space-b")
    expect(await screen.findByText("That idea is not in this space")).toBeInTheDocument()
  })
})
