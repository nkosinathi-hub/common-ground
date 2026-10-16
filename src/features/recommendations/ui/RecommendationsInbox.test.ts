import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { FORMER_MEMBER } from "@/shared/domain"
import { RecommendationsService } from "../application/recommendations-service"
import { FakeRecommendationsGateway } from "../testing/fake-recommendations-gateway"
import { provideRecommendations } from "./context"
import Provided from "@/shared/ui/testing/Provided.svelte"
import RecommendationsInbox from "./RecommendationsInbox.svelte"

function setup(configure: (gateway: FakeRecommendationsGateway) => void) {
  const gateway = new FakeRecommendationsGateway(2)
  configure(gateway)
  const provide = () => provideRecommendations({ service: new RecommendationsService(gateway) })
  const itemHref = (id: string) => `#/s/watch/${id}`
  const props = { spaceId: "s", itemHref }
  render(Provided, { props: { provide, component: RecommendationsInbox, props } })
  return gateway
}

afterEach(cleanup)

describe("RecommendationsInbox", () => {
  it("lists what was recommended to me with a link, sender and plain-text note", async () => {
    setup((g) => g.receive("s", 1, { note: "<i>trust me</i>" }))
    const link = await screen.findByRole("link", { name: "Title 1" })
    expect(link).toHaveAttribute("href", "#/s/watch/w1")
    expect(screen.getByText("From Zola")).toBeInTheDocument()
    expect(screen.getByText("<i>trust me</i>")).toBeInTheDocument()
  })

  it("acknowledges and dismisses, removing each from the list", async () => {
    const gateway = setup((g) => g.receive("s", 2))
    await fireEvent.click(await screen.findByRole("button", { name: "Acknowledge Title 2" }))
    await waitFor(() => expect(screen.queryByText("Title 2")).toBeNull())
    await fireEvent.click(screen.getByRole("button", { name: "Dismiss Title 1" }))
    expect(await screen.findByText("Nothing waiting for you")).toBeInTheDocument()
    expect(gateway.calls).toEqual(["acknowledged:r2", "dismissed:r1"])
  })

  it("shows more on request and falls back when the title or sender is gone", async () => {
    setup((g) => {
      g.receive("s", 2)
      g.receive("s", 1, { itemTitle: null, senderName: null })
    })
    await screen.findByText("Title 2")
    await fireEvent.click(screen.getByRole("button", { name: "Show more" }))
    expect(await screen.findByText("Title 1")).toBeInTheDocument()
    expect(screen.getByText("A saved title")).toBeInTheDocument()
    expect(screen.getByText(`From ${FORMER_MEMBER}`)).toBeInTheDocument()
  })

  it("offers a retry when loading fails", async () => {
    const gateway = setup((g) => (g.failWith = { kind: "network", message: "Offline" }))
    const retry = await screen.findByRole("button", { name: /try again/i })
    gateway.failWith = null
    await fireEvent.click(retry)
    expect(await screen.findByText("Nothing waiting for you")).toBeInTheDocument()
  })
})
