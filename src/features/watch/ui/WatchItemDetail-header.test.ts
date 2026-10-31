import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { CatalogService, provideCatalog } from "@/features/catalog"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { PARTNER, SPACE_ID, item } from "../testing/fixtures"
import { emptyCatalogGateway, watchFakes } from "../testing/render-context"
import { provideWatch } from "./context"
import WatchItemDetail from "./WatchItemDetail.svelte"

afterEach(cleanup)

function renderTitle(extra: Parameters<typeof item>[2] = {}) {
  const fakes = watchFakes()
  const title = item(1, "Shelf copy", { availabilityNote: "Borrowed from Mum", ...extra })
  fakes.gateway.items = [title]
  const provide = () => {
    provideWatch(fakes.context)
    provideCatalog({ service: new CatalogService(emptyCatalogGateway) })
  }
  const props = { spaceId: SPACE_ID, itemId: title.id, backHref: "#/back" }
  render(Provided, { props: { provide, component: WatchItemDetail, props } })
  return { ...fakes, title }
}
const menu = async () =>
  fireEvent.keyDown(await screen.findByRole("button", { name: /^More for/ }), { key: "Enter" })

describe("WatchItemDetail header", () => {
  it("likes privately, swaps to a dislike, and clears with the same tap", async () => {
    const { opinionRows, title } = renderTitle()
    const like = await screen.findByRole("button", { name: "I liked it" })
    await fireEvent.click(like)
    await waitFor(() => expect(opinionRows.rows.get(title.id)).toBe("liked"))
    await waitFor(() => expect(like).toHaveAttribute("aria-pressed", "true"))
    const dislike = screen.getByRole("button", { name: "Not for me" })
    await fireEvent.click(dislike)
    await waitFor(() => expect(dislike).toHaveAttribute("aria-pressed", "true"))
    expect(opinionRows.rows.get(title.id)).toBe("disliked")
    await fireEvent.click(dislike)
    await waitFor(() => expect(opinionRows.rows.has(title.id)).toBe(false))
  })

  it("edits a hand-added title's details from its menu", async () => {
    renderTitle()
    await menu()
    await fireEvent.click(await screen.findByRole("menuitem", { name: "Edit details" }))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("keeps a catalog title's details, and offers Delete only when allowed", async () => {
    renderTitle({ catalog: { type: "movie", id: 7 }, createdBy: PARTNER })
    await screen.findByRole("heading", { name: "Shelf copy" })
    expect(screen.queryByRole("button", { name: /^More for/ })).toBeNull()
  })
})
