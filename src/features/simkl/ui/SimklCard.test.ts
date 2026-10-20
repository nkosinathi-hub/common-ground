import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { SimklService } from "../application/simkl-service"
import type { SimklLink } from "../domain/types"
import { FakeSimklGateway } from "../testing/fake-simkl-gateway"
import { provideSimkl } from "./context"
import SimklCard from "./SimklCard.svelte"

afterEach(cleanup)

function setup(link: SimklLink | null) {
  const gateway = new FakeSimklGateway(link)
  const provide = () => provideSimkl({ service: new SimklService(gateway) })
  render(Provided, { props: { provide, component: SimklCard } })
  return gateway
}

describe("SimklCard", () => {
  it("connects by showing the code and the page to enter it on", async () => {
    setup(null)
    await fireEvent.click(await screen.findByRole("button", { name: "Connect Simkl" }))
    expect(await screen.findByText("ABCDE")).toBeInTheDocument()
    const link = screen.getByRole("link", { name: /simkl\.com\/pin/ })
    expect(link).toHaveAttribute("href", "https://simkl.com/pin")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(await screen.findByRole("button", { name: "Connect Simkl" })).toBeInTheDocument()
  })

  it("once connected, offers a sync now and a disconnect", async () => {
    const gateway = setup({ connectedAt: "2026-03-01T10:00:00Z", lastSyncedAt: null })
    expect(await screen.findByText(/Not synced yet/)).toBeInTheDocument()
    await fireEvent.click(screen.getByRole("button", { name: "Sync now" }))
    expect(await screen.findByText(/Last synced/)).toBeInTheDocument()
    await fireEvent.click(screen.getByRole("button", { name: "Disconnect" }))
    expect(await screen.findByRole("button", { name: "Connect Simkl" })).toBeInTheDocument()
    expect(gateway.calls).toEqual(["status", "sync", "disconnect"])
  })

  it("says why when Simkl cannot be reached", async () => {
    const gateway = new FakeSimklGateway(null)
    gateway.failNext = true
    const provide = () => provideSimkl({ service: new SimklService(gateway) })
    render(Provided, { props: { provide, component: SimklCard } })
    expect(await screen.findByRole("alert")).toHaveTextContent("Simkl is down")
  })
})
