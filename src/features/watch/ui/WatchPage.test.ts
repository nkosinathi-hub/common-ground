import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { CatalogService, provideCatalog } from "@/features/catalog"
import { SPACE_ID, item } from "../testing/fixtures"
import Provided from "../testing/Provided.svelte"
import { emptyCatalogGateway, watchFakes } from "../testing/render-context"
import { provideWatch } from "./context"
import WatchPage from "./WatchPage.svelte"

afterEach(cleanup)
const cards = () => within(screen.getByRole("list")).getAllByRole("link")

function setup(count = 0) {
  const fakes = watchFakes()
  const provide = () => {
    provideWatch({ service: fakes.service, members: fakes.members })
    provideCatalog(new CatalogService(emptyCatalogGateway))
  }
  fakes.gateway.items = Array.from({ length: count }, (_, n) =>
    item(n + 1, `Title ${n + 1}`, { intent: n % 2 ? "watch_together" : "want_to_watch" }),
  )
  const itemHref = (id: string) => `#/s/${SPACE_ID}/watch/${id}`
  const props = { spaceId: SPACE_ID, itemHref }
  render(Provided, { props: { provide, component: WatchPage, props } })
  return fakes
}

describe("WatchPage", () => {
  it("welcomes an empty space with onboarding copy", async () => {
    setup()
    expect(await screen.findByText("Your next night in starts here")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add your first title" })).toBeInTheDocument()
  })

  it("pages through 150 titles with load more", async () => {
    setup(150)
    await waitFor(() => expect(cards()).toHaveLength(50))
    expect(cards()[0]).toHaveAttribute(
      "href",
      expect.stringMatching(/watch\/00000000-0000-4000-8000-000000000150$/),
    )
    for (const expected of [100, 150]) {
      await fireEvent.click(screen.getByRole("button", { name: "Load more" }))
      await waitFor(() => expect(cards()).toHaveLength(expected))
    }
    await fireEvent.click(screen.getByRole("button", { name: "Load more" }))
    await waitFor(() => expect(screen.queryByRole("button", { name: "Load more" })).toBeNull())
  })

  it("shows a no-match state for filters and clears them", async () => {
    setup(3)
    await waitFor(() => expect(cards()).toHaveLength(3))
    await fireEvent.click(screen.getByRole("button", { name: "Anime" }))
    expect(await screen.findByText("Nothing here just yet")).toBeInTheDocument()
    await fireEvent.click(screen.getByRole("button", { name: "Clear filters" }))
    await waitFor(() => expect(cards()).toHaveLength(3))
  })

  it("picks from the watch-together queue and retries", async () => {
    setup(4)
    await fireEvent.click(await screen.findByRole("button", { name: "Pick for us" }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveTextContent("Tonight's little adventure")
    await waitFor(() => expect(screen.getByRole("button", { name: "One more pick" })).toBeVisible())
    const first = screen.getByRole("heading", { level: 3 }).textContent
    expect(["Title 2", "Title 4"]).toContain(first)
    await fireEvent.click(screen.getByRole("button", { name: "One more pick" }))
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 3 }).textContent).not.toBe(first),
    )
  })

  it("adds a title manually from the add dialog", async () => {
    const { gateway } = setup()
    await fireEvent.click(await screen.findByRole("button", { name: "Add a title" }))
    await fireEvent.click(await screen.findByRole("button", { name: /add a title manually/i }))
    await fireEvent.input(screen.getByLabelText("Title"), { target: { value: "Home video" } })
    await fireEvent.click(screen.getByRole("button", { name: "Add to your list" }))
    await waitFor(() => expect(gateway.items.map((i) => i.title)).toEqual(["Home video"]))
    expect(await screen.findByRole("link", { name: /Home video/ })).toBeInTheDocument()
  })
})
