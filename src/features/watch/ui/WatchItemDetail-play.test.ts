import { cleanup, render, screen } from "@testing-library/svelte"
import { createRawSnippet } from "svelte"
import { afterEach, describe, expect, it } from "vitest"
import { CatalogService, provideCatalog } from "@/features/catalog"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { SPACE_ID, item } from "../testing/fixtures"
import { emptyCatalogGateway, watchFakes } from "../testing/render-context"
import type { WatchItem } from "../domain/types"
import { provideWatch } from "./context"
import WatchItemDetail from "./WatchItemDetail.svelte"

afterEach(cleanup)

describe("WatchItemDetail play slot", () => {
  it("hands the loaded title to the caller's player, under the header", async () => {
    const fakes = watchFakes()
    const film = item(1, "Night", { catalog: { type: "movie", id: 10331 } })
    fakes.gateway.items = [film]
    const play = createRawSnippet((current: () => WatchItem) => ({
      render: () => `<p>Play ${current().title} (${current().catalog?.id})</p>`,
    }))
    const provide = () => {
      provideWatch({ service: fakes.service, members: fakes.members, authors: fakes.members })
      provideCatalog({ service: new CatalogService(emptyCatalogGateway) })
    }
    const props = { spaceId: SPACE_ID, itemId: film.id, backHref: "#/back", play }
    render(Provided, { props: { provide, component: WatchItemDetail, props } })
    expect(await screen.findByText("Play Night (10331)")).toBeInTheDocument()
  })
})
