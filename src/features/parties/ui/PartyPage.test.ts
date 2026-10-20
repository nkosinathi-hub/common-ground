import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import type { Party } from "../domain/party"
import { partyOf, SPACE } from "../testing/fake-party-gateway"
import { partiesFakes } from "../testing/parties-context"
import { provideParties } from "./context"
import PartyPage from "./PartyPage.svelte"

afterEach(cleanup)

function setup(party: Partial<Party> = {}, me = "me") {
  const fakes = partiesFakes(me)
  fakes.gateway.parties.set("p1", partyOf("p1", "me", party))
  const provide = () => provideParties(fakes.context)
  const props = { spaceId: SPACE, partyId: "p1", me, itemHref: (id: string) => `#/item/${id}` }
  render(Provided, { props: { provide, component: PartyPage, props } })
  return fakes
}

describe("PartyPage, in the app (#57)", () => {
  it("starts only after Ready, then offers live controls", async () => {
    setup()
    const play = await screen.findByRole("button", { name: "Play for everyone" })
    expect(play).toBeDisabled()
    await fireEvent.click(screen.getByRole("button", { name: "I am ready" }))
    await waitFor(() => expect(play).toBeEnabled())
    await fireEvent.click(play)
    expect(await screen.findByText("Playing")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back 10 seconds" })).toBeInTheDocument()
  })

  it("lets the host cancel, and only the host", async () => {
    const { gateway } = setup()
    await fireEvent.click(await screen.findByRole("button", { name: "Cancel the party" }))
    expect(await screen.findByText(/This party was cancelled/)).toBeInTheDocument()
    expect(gateway.calls).toContainEqual(["cancel", "p1"])
    cleanup()
    setup({}, "lindi")
    await screen.findByRole("button", { name: "I am ready" })
    expect(screen.queryByRole("button", { name: "Cancel the party" })).toBeNull()
    expect(screen.getByRole("link", { name: "Back to the title" })).toHaveAttribute(
      "href",
      "#/item/1c9d2f6e-6a43-4c8e-9f0a-3d2b1c4e5f61",
    )
  })

  it("says when a party cannot be opened", async () => {
    const fakes = partiesFakes()
    render(Provided, {
      props: {
        provide: () => provideParties(fakes.context),
        component: PartyPage,
        props: { spaceId: SPACE, partyId: "gone", me: "me", itemHref: () => "#/" },
      },
    })
    expect(await screen.findByText("This is not available")).toBeInTheDocument()
  })
})
