import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { createRawSnippet } from "svelte"
import { afterEach, describe, expect, it } from "vitest"
import { CatalogService, provideCatalog } from "@/features/catalog"
import { ME, PARTNER, SPACE_ID, item } from "../testing/fixtures"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { emptyCatalogGateway, watchFakes } from "../testing/render-context"
import { provideWatch } from "./context"
import WatchItemDetail from "./WatchItemDetail.svelte"

afterEach(cleanup)

const html = (text: string) => createRawSnippet(() => ({ render: () => `<p>${text}</p>` }))
const film = createRawSnippet((f: () => boolean) => ({ render: () => `<p>Film ${f()}</p>` }))

function setup(extra: Parameters<typeof item>[2] = {}, fakes = watchFakes()) {
  const provide = () => {
    provideWatch({ service: fakes.service, members: fakes.members, authors: fakes.members })
    provideCatalog({ service: new CatalogService(emptyCatalogGateway) })
  }
  const show = item(1, "Home video", {
    mediaType: "series",
    availabilityNote: "On the shelf",
    ...extra,
  })
  fakes.gateway.items = [show]
  const watching = { status: "watching", season: 1, episode: 4, rating: 3 } as const
  fakes.gateway.progressRows = [{ userId: PARTNER, ...watching, completedOn: null, updatedAt: "" }]
  const props = {
    ...{ spaceId: SPACE_ID, itemId: show.id, backHref: "#/back", together: film },
    ...{ comments: html("Comments go here"), recommend: html("Recommend goes here") },
  }
  render(Provided, { props: { provide, component: WatchItemDetail, props } })
  return fakes
}

describe("WatchItemDetail", () => {
  it("shows a manual title with its unverified note and the caller's snippets", async () => {
    setup()
    expect(await screen.findByRole("heading", { name: "Home video" })).toBeInTheDocument()
    expect(screen.getAllByText("On the shelf")[0]).toBeInTheDocument()
    expect(screen.getAllByText(/not a provider listing/)[0]).toBeInTheDocument()
    expect(screen.getByText("Comments go here")).toBeInTheDocument()
    expect(screen.getByText("Recommend goes here")).toBeInTheDocument()
    expect(screen.getByText("Film false")).toBeInTheDocument()
    expect(await screen.findByText("S1 E4")).toBeInTheDocument()
    expect(screen.getByText("Lindi")).toBeInTheDocument()
    expect(screen.getByText("Only Lindi changes this.")).toBeInTheDocument()
  })

  it("names a removed member's progress from their still-visible profile", async () => {
    const fakes = watchFakes()
    fakes.members.list = fakes.members.list.filter((m) => m.id !== PARTNER)
    fakes.members.former = [{ id: PARTNER, displayName: "Lindi" }]
    setup({}, fakes)
    expect(await screen.findByText("S1 E4")).toBeInTheDocument()
    expect(screen.getByText("Lindi")).toBeInTheDocument()
  })

  it("saves my progress without touching my partner's", async () => {
    const { gateway } = setup()
    const status = await screen.findByLabelText("Status")
    await fireEvent.change(status, { target: { value: "completed" } })
    await fireEvent.click(screen.getByRole("button", { name: "Save my progress" }))
    await waitFor(() => expect(gateway.progressRows).toHaveLength(2))
    const mine = gateway.progressRows.find((p) => p.userId === ME)
    expect(mine).toMatchObject({ status: "completed", rating: null })
    expect(mine?.completedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(gateway.progressRows.find((p) => p.userId === PARTNER)?.status).toBe("watching")
  })

  it("logs a watched-together night with who was there", async () => {
    const { gateway } = setup()
    await fireEvent.click(await screen.findByRole("button", { name: "Log watched together" }))
    const partner = await screen.findByRole("checkbox", { name: "Lindi" })
    expect(partner).toBeChecked()
    await fireEvent.click(partner)
    await fireEvent.click(screen.getByRole("button", { name: "Log it" }))
    await waitFor(() => expect(gateway.sessionRows).toHaveLength(1))
    expect(gateway.sessionRows[0]?.memberIds).toEqual([ME])
    expect(await screen.findByText("Nkosi")).toBeInTheDocument()
  })

  it("deletes from its menu after confirmation, and only when allowed", async () => {
    const menu = async () =>
      fireEvent.keyDown(await screen.findByRole("button", { name: /^More for/ }), { key: "Enter" })
    const { gateway } = setup()
    await menu()
    await fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }))
    const confirm = within(await screen.findByRole("alertdialog"))
    await fireEvent.click(confirm.getByRole("button", { name: "Delete" }))
    await waitFor(() => expect(gateway.items).toHaveLength(0))
    expect(window.location.hash).toBe("#/back")
    cleanup()
    setup({ createdBy: PARTNER })
    await screen.findByRole("heading", { name: "Home video" })
    expect(screen.queryByRole("button", { name: /^More for/ })).toBeNull()
  })
})
