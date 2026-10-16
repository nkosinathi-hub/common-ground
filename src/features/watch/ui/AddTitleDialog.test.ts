import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CatalogService, provideCatalog } from "@/features/catalog"
import { ok } from "@/shared/domain"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { SPACE_ID } from "../testing/fixtures"
import { emptyCatalogGateway, watchFakes } from "../testing/render-context"
import AddTitleDialog from "./AddTitleDialog.svelte"
import { provideWatch } from "./context"

afterEach(cleanup)

const dune = {
  id: 1,
  type: "movie" as const,
  title: "Dune",
  year: 2021,
  mediaKind: "movie" as const,
  posterPath: null,
  synopsis: "Sand",
}
const catalog = {
  ...emptyCatalogGateway,
  search: async () =>
    ok({
      results: [dune],
      page: 1,
      totalPages: 1,
      checkedAt: "2026-10-15T10:00:00Z",
      stale: false,
    }),
}

function setup(extra: Record<string, unknown> = {}) {
  const fakes = watchFakes()
  const onAdded = vi.fn()
  const provide = () => {
    provideWatch({ service: fakes.service, members: fakes.members })
    provideCatalog({ service: new CatalogService(catalog) })
  }
  const props = { open: true, spaceId: SPACE_ID, onAdded, ...extra }
  render(Provided, { props: { provide, component: AddTitleDialog, props } })
  return { ...fakes, onAdded }
}

const search = () => screen.getByRole("searchbox") as HTMLInputElement

async function addManually(title: string) {
  await fireEvent.click(await screen.findByRole("button", { name: /add a title manually/i }))
  await fireEvent.input(screen.getByLabelText("Title"), { target: { value: title } })
  await fireEvent.click(screen.getByRole("button", { name: "Add to your list" }))
}

describe("AddTitleDialog", () => {
  it("keeps the dialog open after a manual add, back on a cleared, focused search", async () => {
    const { gateway, onAdded } = setup()
    await addManually("Home video")
    await waitFor(() => expect(gateway.items.map((i) => i.title)).toEqual(["Home video"]))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    await waitFor(() => expect(search()).toHaveFocus())
    expect(search().value).toBe("")
    expect(onAdded).toHaveBeenCalledWith(gateway.items[0]!.id)
  })

  it("keeps the dialog open after a catalog pick and lists every title added", async () => {
    const { gateway, onAdded } = setup()
    await fireEvent.input(search(), { target: { value: "dune" } })
    await fireEvent.click(
      await screen.findByRole("button", { name: "Add Dune" }, { timeout: 2000 }),
    )
    await waitFor(() => expect(gateway.items).toHaveLength(1))
    await addManually("Home video")
    const status = await screen.findByRole("status")
    await waitFor(() => expect(status).toHaveTextContent("Added: Dune, Home video"))
    const idOf = (title: string) => gateway.items.find((i) => i.title === title)!.id
    for (const title of ["Dune", "Home video"])
      expect(within(status).getByRole("link", { name: title })).toHaveAttribute(
        "href",
        `#/s/${SPACE_ID}/watch/${idOf(title)}`,
      )
    expect(onAdded).toHaveBeenCalledTimes(2)
  })

  it("starts in the space's default list", async () => {
    setup({ defaultIntent: "watch_together" })
    expect(await screen.findByLabelText("Add to")).toHaveValue("watch_together")
  })

  it("closes on Done", async () => {
    setup()
    await fireEvent.click(await screen.findByRole("button", { name: "Done" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })
})
