import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { buildHash } from "@/shared/domain"
import { inMemoryIdeasService } from "../testing/ideas-fixture"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { provideIdeas } from "./context"
import IdeaDetail from "./IdeaDetail.svelte"

async function setup(spaceId: string) {
  const { service } = inMemoryIdeasService()
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
  render(Provided, {
    props: { provide: () => provideIdeas({ service }), component: IdeaDetail, props },
  })
}

afterEach(() => {
  cleanup()
  window.location.hash = ""
})

describe("IdeaDetail", () => {
  it("goes back to the space's ideas list once the idea is deleted", async () => {
    await setup("space-a")
    const more = await screen.findByRole("button", { name: "More for Tea bar" })
    await fireEvent.keyDown(more, { key: "Enter" })
    await fireEvent.click(await screen.findByRole("menuitem", { name: "Delete idea" }))
    const dialog = within(await screen.findByRole("alertdialog"))
    await fireEvent.click(dialog.getByRole("button", { name: "Delete" }))
    const list = buildHash({ name: "ideas", spaceId: "space-a" })
    await waitFor(() => expect(window.location.hash).toBe(list))
  })

  it("labels the open section with its visible name, not a tab panel without tabs", async () => {
    await setup("space-a")
    expect(await screen.findByRole("region", { name: "Overview for Tea bar" })).toBeInTheDocument()
    expect(screen.queryByRole("tabpanel")).toBeNull()
  })

  it("refuses to show an idea under another space", async () => {
    await setup("space-b")
    expect(await screen.findByText("That idea is not in this space")).toBeInTheDocument()
  })
})
