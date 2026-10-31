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
const arrival = { ...dune, id: 2, title: "Arrival", year: 2016 }
const catalog = {
  ...emptyCatalogGateway,
  search: async () =>
    ok({
      results: [dune, arrival],
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
    provideWatch({ service: fakes.service, members: fakes.members, authors: fakes.members })
    provideCatalog({ service: new CatalogService(catalog) })
  }
  const props = { open: true, spaceId: SPACE_ID, onAdded, ...extra }
  render(Provided, { props: { provide, component: AddTitleDialog, props } })
  return { ...fakes, onAdded }
}

const search = () => screen.getByRole<HTMLInputElement>("searchbox")

async function addManually(title: string) {
  await fireEvent.click(await screen.findByRole("radio", { name: "Enter manually" }))
  await fireEvent.input(screen.getByLabelText("Title"), { target: { value: title } })
  await fireEvent.click(screen.getByRole("button", { name: "Add title" }))
}

/** Searches "dune" and adds the first result, waiting for it to be saved. */
async function pickDune(items: readonly unknown[]) {
  await fireEvent.input(search(), { target: { value: "dune" } })
  await fireEvent.click(await screen.findByRole("button", { name: "Add Dune" }, { timeout: 2000 }))
  await waitFor(() => expect(items).toHaveLength(1))
}

describe("AddTitleDialog", () => {
  it("turns a picked result into a tick and keeps the search, so the next can be added", async () => {
    const { gateway, onAdded } = setup()
    await pickDune(gateway.items)
    expect(await screen.findByText("Added to your space")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add Dune" })).toBeNull()
    expect(search().value).toBe("dune")
    await waitFor(() => expect(search()).toHaveFocus())
    await fireEvent.click(screen.getByRole("button", { name: "Add Arrival" }))
    await waitFor(() => expect(gateway.items.map((i) => i.title)).toEqual(["Dune", "Arrival"]))
    expect(screen.getAllByText("Added to your space")).toHaveLength(2)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(onAdded).toHaveBeenCalledTimes(2)
  })

  it("comes back from a manual add to the same search, and lists every title added", async () => {
    const { gateway } = setup()
    await pickDune(gateway.items)
    await addManually("Home video")
    await waitFor(() => expect(search()).toHaveFocus())
    expect(search().value).toBe("dune")
    expect(screen.getByRole("button", { name: "Add Arrival" })).toBeInTheDocument()
    const status = await screen.findByRole("status")
    await waitFor(() => expect(status).toHaveTextContent("Added: Dune, Home video"))
    const link = within(status).getByRole("link", { name: "Home video" })
    expect(link).toHaveAttribute("href", `#/s/${SPACE_ID}/watch/${gateway.items[1]!.id}`)
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
