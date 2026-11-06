import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import type { WatchItem } from "../domain/types"
import { createRawSnippet } from "svelte"
import { afterEach, describe, expect, it } from "vitest"
import { CatalogService, provideCatalog } from "@/features/catalog"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { ME, PARTNER, SPACE_ID, item } from "../testing/fixtures"
import { emptyCatalogGateway, watchFakes } from "../testing/render-context"
import { provideWatch } from "./context"
import WatchItemDetail from "./WatchItemDetail.svelte"

afterEach(cleanup)

const html = (text: string) => createRawSnippet(() => ({ render: () => `<p>${text}</p>` }))
const together = createRawSnippet((item: () => WatchItem, compact: () => boolean) => ({
  render: () => `<p>Together ${item().mediaType === "movie"} ${compact()}</p>`,
}))

function setup(extra: Parameters<typeof item>[2] = {}, fakes = watchFakes()) {
  const provide = () => {
    provideWatch(fakes.context)
    provideCatalog({ service: new CatalogService(emptyCatalogGateway) })
  }
  const show = item(1, "Home video", {
    mediaType: "series",
    availabilityNote: "On the shelf",
    ...extra,
  })
  fakes.gateway.items = [show]
  const watching = { status: "watching", season: 1, episode: 4 } as const
  fakes.gateway.progressRows = [{ userId: PARTNER, ...watching, completedOn: null, updatedAt: "" }]
  const props = {
    ...{ spaceId: SPACE_ID, itemId: show.id, backHref: "#/back", together },
    ...{ discussion: html("Comments go here"), tools: html("Recommend goes here") },
  }
  render(Provided, { props: { provide, component: WatchItemDetail, props } })
  return fakes
}

describe("WatchItemDetail", () => {
  it("keeps availability hidden and secondary information out of the main page", async () => {
    setup()
    expect(await screen.findByRole("heading", { name: "Home video" })).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Where to watch" })).toBeNull()
    expect(screen.getByText("Progress and discussion").closest("details")).not.toHaveAttribute(
      "open",
    )
    await fireEvent.click(screen.getByText("Progress and discussion"))
    expect(screen.getByText("Comments go here")).toBeInTheDocument()
    await fireEvent.click(screen.getByRole("button", { name: "About this title" }))
    expect(screen.getByText("Recommend goes here")).toBeInTheDocument()
  })

  it("lists everyone's place, you first, and names removed members still visible", async () => {
    const fakes = watchFakes()
    fakes.members.list = fakes.members.list.filter((m) => m.id !== PARTNER)
    fakes.members.former = [{ id: PARTNER, displayName: "Lindi" }]
    setup({}, fakes)
    await fireEvent.click(await screen.findByText("Progress and discussion"))
    const places = within(await screen.findByRole("list", { name: "Everyone's place" }))
    const [mine, theirs] = places.getAllByRole("listitem")
    expect(mine).toHaveTextContent("Nkosi (you)")
    expect(theirs).toHaveTextContent(/Lindi\s*S1E4/)
  })

  it("adjusts my place without touching my partner's", async () => {
    const { gateway } = setup()
    await fireEvent.click(await screen.findByText("Progress and discussion"))
    await fireEvent.click(await screen.findByRole("button", { name: "Adjust my place" }))
    const dialog = within(await screen.findByRole("dialog", { name: "Adjust my place" }))
    await fireEvent.change(dialog.getByLabelText("Status"), { target: { value: "completed" } })
    await fireEvent.click(dialog.getByRole("button", { name: "Save my progress" }))
    await waitFor(() => expect(gateway.progressRows).toHaveLength(2))
    expect(gateway.progressRows.find((p) => p.userId === ME)).toMatchObject({ status: "completed" })
    expect(gateway.progressRows.find((p) => p.userId === PARTNER)?.status).toBe("watching")
  })

  it("logs a watched-together night by hand", async () => {
    const { gateway } = setup()
    await fireEvent.click(await screen.findByText("Progress and discussion"))
    await fireEvent.click(await screen.findByRole("button", { name: "Log watched together" }))
    await fireEvent.click(await screen.findByRole("button", { name: "Log watch" }))
    await waitFor(() => expect(gateway.sessionRows).toHaveLength(1))
  })

  it("deletes from its menu after confirmation", async () => {
    const { gateway } = setup()
    await fireEvent.click(await screen.findByRole("button", { name: "About this title" }))
    await fireEvent.keyDown(await screen.findByRole("button", { name: /^More for/ }), {
      key: "Enter",
    })
    await fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }))
    const confirm = within(await screen.findByRole("alertdialog"))
    await fireEvent.click(confirm.getByRole("button", { name: "Delete" }))
    await waitFor(() => expect(gateway.items).toHaveLength(0))
    expect(window.location.hash).toBe("#/back")
  })
})
