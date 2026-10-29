import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { CatalogService, provideCatalog } from "@/features/catalog"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { ME, SPACE_ID, item } from "../testing/fixtures"
import { emptyCatalogGateway, watchFakes } from "../testing/render-context"
import { provideWatch } from "./context"
import WatchItemDetail from "./WatchItemDetail.svelte"

afterEach(cleanup)

/** A hand-added title, so its availability note sits in the progress tab's aside. */
function renderTitle() {
  const fakes = watchFakes()
  const title = item(1, "Shelf copy", { availabilityNote: "Borrowed from Mum" })
  fakes.gateway.items = [title]
  const provide = () => {
    provideWatch({ service: fakes.service, members: fakes.members, authors: fakes.members })
    provideCatalog({ service: new CatalogService(emptyCatalogGateway) })
  }
  const props = { spaceId: SPACE_ID, itemId: title.id, backHref: "#/back" }
  render(Provided, { props: { provide, component: WatchItemDetail, props } })
  return fakes.gateway
}

describe("WatchItemDetail header", () => {
  it("rates from the stars and keeps my place", async () => {
    const gateway = renderTitle()
    expect(await screen.findByText("Not rated")).toBeInTheDocument()
    await fireEvent.click(screen.getByRole("button", { name: "Rate 4 of 5" }))
    await waitFor(() => expect(gateway.progressRows).toHaveLength(1))
    expect(gateway.progressRows[0]).toMatchObject({ userId: ME, status: "not_started", rating: 4 })
    expect(await screen.findByText("4 of 5")).toBeInTheDocument()
  })

  it("edits the details from the availability note", async () => {
    renderTitle()
    await fireEvent.click(await screen.findByRole("button", { name: "Edit details" }))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })
})
