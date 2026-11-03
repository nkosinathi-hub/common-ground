import { fireEvent, render, screen } from "@testing-library/svelte"
import { CatalogService, provideCatalog } from "@/features/catalog"
import { FakeCatalogGateway } from "@/features/catalog/testing/fake-catalog-gateway"
import { title } from "@/features/catalog/testing/fixtures"
import { SearchService, provideSearch } from "@/features/search"
import { watchFakes } from "@/features/watch/testing/render-context"
import { item, SPACE_ID } from "@/features/watch/testing/fixtures"
import { provideWatch } from "@/features/watch/ui/context"
import { ok } from "@/shared/domain"
import Provided from "@/shared/ui/testing/Provided.svelte"
import UniversalSearch from "./UniversalSearch.svelte"
import { demoSpace } from "../demo/identity"
import type { Space } from "@/features/spaces"

export function searchFixture() {
  const watch = watchFakes(),
    catalog = new FakeCatalogGateway()
  watch.gateway.items = [item(1, "Dune", { catalog: { type: "movie", id: 1 } })]
  catalog.titles = [title(1, "Dune"), title(2, "Dune: Part Two"), title(3, "Arrival")]
  const service = new SearchService({
    search: async (_space, query) =>
      ok({
        hits: watch.gateway.items
          .filter((i) => i.title.toLowerCase().includes(query))
          .map((i) => ({
            id: i.id,
            kind: "watch" as const,
            title: i.title,
            preview: "",
            catalog: i.catalog ?? undefined,
            route: { name: "watch-item" as const, spaceId: SPACE_ID, itemId: i.id },
          })),
        unavailable: [],
        more: false,
      }),
  })
  render(Provided, {
    props: {
      provide: () => {
        provideWatch(watch.context)
        provideCatalog({ service: new CatalogService(catalog) })
        provideSearch(service)
      },
      component: UniversalSearch,
      props: {
        space: {
          ...demoSpace,
          id: SPACE_ID,
          defaultWatchIntent: "watch_together",
        } as unknown as Space,
      },
    },
  })
  const search = async (value: string) => {
    if (!screen.queryByRole("searchbox"))
      await fireEvent.click(screen.getByRole("button", { name: "Open search" }))
    const input = await screen.findByRole("searchbox", { name: "Search everything" })
    await fireEvent.input(input, { target: { value } })
    return input
  }
  return { watch, catalog, search }
}
