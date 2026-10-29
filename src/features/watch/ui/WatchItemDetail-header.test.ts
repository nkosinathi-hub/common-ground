import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { CatalogService, provideCatalog } from "@/features/catalog"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { SPACE_ID, item } from "../testing/fixtures"
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
  it("edits the details from the availability note", async () => {
    renderTitle()
    await fireEvent.click(await screen.findByRole("button", { name: "Edit details" }))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })
})
