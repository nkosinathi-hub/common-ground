import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { ITEM, partyOf, SPACE } from "../testing/fake-party-gateway"
import { partiesFakes } from "../testing/parties-context"
import { provideParties } from "./context"
import PartyPage from "./PartyPage.svelte"
import WatchTogether from "./WatchTogether.svelte"

afterEach(cleanup)

function page() {
  const fakes = partiesFakes()
  fakes.gateway.parties.set("p1", partyOf("p1", "me", { source: "netflix" }))
  const provide = () => provideParties(fakes.context)
  const props = { spaceId: SPACE, partyId: "p1", me: "me", itemHref: () => "#/" }
  render(Provided, { props: { provide, component: PartyPage, props } })
  return fakes
}

/** The member's extension on netflix.com, connected to the same party. */
function extension(fakes: ReturnType<typeof partiesFakes>) {
  const handlers = { onMessage: () => undefined, onPresence: () => undefined, onStatus: () => {} }
  const joinedAt = "2026-10-22T20:00:00Z"
  const conn = fakes.hub.connect("p1", handlers)
  return (ready: boolean) =>
    conn.track({ userId: "me", ready, buffering: false, joinedAt, role: "player" })
}

describe("Netflix parties (#66)", () => {
  it("can be started on Netflix", async () => {
    const fakes = partiesFakes()
    const props = { spaceId: SPACE, itemId: ITEM, isFilm: true }
    const provide = () => provideParties(fakes.context)
    render(Provided, { props: { provide, component: WatchTogether, props } })
    await fireEvent.click(await screen.findByRole("button", { name: "Watch together" }))
    await fireEvent.click(screen.getByLabelText("On Netflix (with the Common Ground extension)"))
    await fireEvent.click(screen.getByRole("button", { name: "Start the party" }))
    await waitFor(() =>
      expect(fakes.gateway.calls).toContainEqual([
        "start",
        { watchItemId: ITEM, source: "netflix", range: null },
      ]),
    )
  })

  it("opens the title on netflix.com and says phones are the remote", async () => {
    page()
    const link = await screen.findByRole("link", { name: /Open Severance on Netflix/ })
    expect(link).toHaveAttribute("href", "https://www.netflix.com/search?q=Severance")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
    expect(screen.getByText(/phone is the remote/)).toBeInTheDocument()
  })

  it("falls back to the shared 3-2-1 while no extension is connected", async () => {
    page()
    await fireEvent.click(await screen.findByRole("button", { name: "We are on S1E1" }))
    expect(await screen.findByRole("button", { name: "Start the 3-2-1" })).toBeEnabled()
  })

  it("is a remote for the players: play together, pause, resume", async () => {
    const fakes = page()
    await screen.findByRole("link", { name: /on Netflix/ })
    const track = extension(fakes)
    track(false)
    expect(await screen.findByText("On Netflix, not ready")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Play together" })).toBeDisabled()
    track(true)
    const play = await screen.findByRole("button", { name: "Play together" })
    await waitFor(() => expect(play).toBeEnabled())
    expect(screen.getByText("Ready on Netflix")).toBeInTheDocument()
    await fireEvent.click(play)
    await fireEvent.click(await screen.findByRole("button", { name: "Pause for everyone" }))
    expect(await screen.findByRole("button", { name: "Resume for everyone" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "We finished" })).toBeInTheDocument()
  })
})
