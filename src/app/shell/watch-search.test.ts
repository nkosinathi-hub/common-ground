import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { appError } from "@/shared/domain"
import { SPACE_ID } from "@/features/watch/testing/fixtures"
import { searchFixture as setup } from "../search/search-fixture"

afterEach(cleanup)

describe("universal search", () => {
  it("searches saved and catalog titles from one field and opens existing titles", async () => {
    const { search, catalog } = setup()
    await search("dune")
    expect(await screen.findByRole("button", { name: "Add Dune: Part Two" })).toBeVisible()
    expect(
      within(screen.getByRole("region", { name: "Workspace matches" })).getByRole("link", {
        name: /Dune/,
      }),
    ).toBeVisible()
    expect(screen.getAllByRole("searchbox")).toHaveLength(1)
    expect(screen.getByRole("link", { name: "Open Dune" })).toHaveAttribute(
      "href",
      `#/s/${SPACE_ID}/watch/00000000-0000-4000-8000-000000000001`,
    )
    expect(screen.queryByRole("button", { name: "Add Dune" })).toBeNull()
    expect(catalog.calls.at(-1)?.request).toMatchObject({ query: "dune", spaceId: SPACE_ID })
  })
  it("adds from search using the default list and keeps the query", async () => {
    const { watch, search } = setup(),
      input = await search("arrival")
    await fireEvent.click(await screen.findByRole("button", { name: "Add Arrival" }))
    await waitFor(() => expect(watch.gateway.items).toHaveLength(2))
    expect(watch.gateway.items[1]?.intent).toBe("watch_together")
    expect(input).toHaveValue("arrival")
    expect(await screen.findByRole("link", { name: "Open Arrival" })).toBeVisible()
  })
  it("keeps saved results usable during a catalog outage", async () => {
    const { search, catalog } = setup()
    catalog.failWith = appError("network", "Catalog is offline")
    await search("dune")
    expect(await screen.findByRole("alert")).toHaveTextContent("Catalog is offline")
    expect(
      within(screen.getByRole("region", { name: "Workspace matches" })).getByRole("link"),
    ).toBeVisible()
    catalog.failWith = null
    await fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(await screen.findByRole("button", { name: "Add Dune: Part Two" })).toBeVisible()
  })
  it("clears results without creating a second search field", async () => {
    const { search } = setup()
    await search("arrival")
    await screen.findByRole("button", { name: "Add Arrival" })
    await fireEvent.click(screen.getByRole("button", { name: "Clear search" }))
    expect(screen.getByRole("searchbox")).toHaveValue("")
    expect(screen.queryByRole("region", { name: "Discover titles" })).toBeNull()
  })
  it("returns focus to search when manual entry closes after its result trigger disappears", async () => {
    const { search } = setup()
    await search("arrival")
    await fireEvent.click(await screen.findByRole("button", { name: "Enter a title manually" }))
    const dialog = await screen.findByRole("dialog", { name: "Add a title manually" })
    expect(screen.queryByRole("button", { name: "Enter a title manually" })).toBeNull()
    await fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Open search" })).toHaveFocus())
  })
})
