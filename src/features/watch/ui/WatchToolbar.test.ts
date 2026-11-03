import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import { watchFakes } from "../testing/render-context"
import { SPACE_ID } from "../testing/fixtures"
import WatchToolbar from "./WatchToolbar.svelte"
import { WatchListState } from "./watch-list-state.svelte"

afterEach(cleanup)
function setup() {
  const fakes = watchFakes(),
    list = new WatchListState(fakes.service, () => SPACE_ID),
    onpick = vi.fn()
  const set = vi.spyOn(list, "setFilter")
  render(WatchToolbar, { list, counts: { movie: 3, series: 2, anime: 1 }, onpick })
  return { list, set, onpick }
}
describe("progressive collection filters", () => {
  it("shows only the count and two controls until filters are requested", async () => {
    const { onpick } = setup()
    expect(screen.getByText("6 titles")).toBeVisible()
    expect(screen.queryByRole("combobox")).toBeNull()
    expect(screen.queryByRole("radio")).toBeNull()
    await fireEvent.click(screen.getByRole("button", { name: "Pick for us" }))
    expect(onpick).toHaveBeenCalledOnce()
  })
  it("applies a batch once, with a compact summary; cancellation preserves the filters", async () => {
    const { list, set } = setup()
    await fireEvent.click(screen.getByRole("button", { name: "Filters" }))
    await fireEvent.change(await screen.findByLabelText("Type"), { target: { value: "movie" } })
    await fireEvent.change(screen.getByLabelText("My progress"), { target: { value: "watching" } })
    expect(set).not.toHaveBeenCalled()
    await fireEvent.click(screen.getByRole("button", { name: "Apply filters" }))
    await waitFor(() => expect(set).toHaveBeenCalledOnce())
    expect(list.filters).toMatchObject({ mediaType: "movie", myStatus: "watching" })
    expect(screen.getByRole("button", { name: "Filters, 2 active" })).toBeVisible()
    expect(screen.getByText("Movie · Watching")).toBeVisible()
    await fireEvent.click(screen.getByRole("button", { name: "Filters, 2 active" }))
    await fireEvent.change(await screen.findByLabelText("Type"), { target: { value: "anime" } })
    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(list.filters.mediaType).toBe("movie")
    expect(set).toHaveBeenCalledOnce()
  })
  it("resets filters and ordering in one action", async () => {
    const { list } = setup()
    await list.setFilter({ mediaType: "movie", sort: "title" })
    await fireEvent.click(await screen.findByRole("button", { name: "Clear filters" }))
    expect(list.filters).toMatchObject({ mediaType: null, sort: "recent" })
  })
})
