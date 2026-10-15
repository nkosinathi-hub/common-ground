import { cleanup, fireEvent, render, screen, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { CatalogService } from "../application/catalog-service"
import { FakeCatalogGateway } from "../testing/fake-catalog-gateway"
import { SPACE_ID, listing, region } from "../testing/fixtures"
import Provided from "../testing/Provided.svelte"
import Availability from "./Availability.svelte"
import { provideCatalog } from "./context"

function setup(configure: (gateway: FakeCatalogGateway) => void) {
  const gateway = new FakeCatalogGateway()
  configure(gateway)
  const provide = () => provideCatalog(new CatalogService(gateway))
  const props = { spaceId: SPACE_ID, type: "movie", id: 1 }
  const view = render(Provided, { props: { provide, component: Availability, props } })
  return { gateway, view }
}

afterEach(cleanup)

describe("Availability", () => {
  it("shows South Africa first with its categories and collapses other countries", async () => {
    const { view } = setup((g) =>
      g.listings.set(
        "movie:1",
        listing(
          [region("ZA", "South Africa", "Showmax"), region("US", "United States", "Max")],
          false,
        ),
      ),
    )
    expect(await screen.findByText("Showmax")).toBeInTheDocument()
    expect(screen.getByRole("list", { name: "Subscription in South Africa" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /watch options in south africa/i })).toHaveAttribute(
      "href",
      "https://www.themoviedb.org/movie/1/watch?locale=ZA",
    )
    const others = view.container.querySelector("details")
    expect(others).not.toHaveAttribute("open")
    expect(
      within(others as HTMLElement).getByText(/other countries \(1 country\)/i),
    ).toBeInTheDocument()
  })

  it("labels the fallback disclosure when South Africa has no listings", async () => {
    const { view } = setup((g) =>
      g.listings.set(
        "movie:1",
        listing([region("DE", "Germany", "Amazon"), region("GB", "United Kingdom", "Sky")], true),
      ),
    )
    await screen.findByText(/no availability listed for south africa/i)
    const summary = view.container.querySelector("details summary")
    expect(summary).toHaveTextContent("No availability listed for South Africa")
    expect(summary).toHaveTextContent("2 countries")
    expect(view.container.querySelector("details")).not.toHaveAttribute("open")
  })

  it("shows when listings were checked, labels stale data, and refreshes", async () => {
    const { gateway } = setup((g) => {
      g.listings.set("movie:1", listing([region("ZA", "South Africa", "Netflix")], false))
      g.stale = true
    })
    expect(await screen.findByText("Stale")).toBeInTheDocument()
    expect(document.querySelector("time")).toHaveAttribute("datetime", "2026-10-15T10:00:00.000Z")
    gateway.stale = false
    await fireEvent.click(screen.getByRole("button", { name: /refresh listings/i }))
    await screen.findByText("Netflix")
    expect(gateway.calls.map((c) => c.method)).toEqual(["details", "refresh"])
    expect(screen.queryByText("Stale")).not.toBeInTheDocument()
  })

  it("reports a failed load and offers to try again", async () => {
    setup(
      (g) => (g.failWith = { kind: "network", message: "The catalog is unavailable right now." }),
    )
    expect(await screen.findByRole("alert")).toHaveTextContent("unavailable")
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
  })
})
