import { cleanup, render, screen } from "@testing-library/svelte"
import { createRawSnippet } from "svelte"
import { afterEach, describe, expect, it } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import type { Party } from "../domain/party"
import { partyOf, SPACE } from "../testing/fake-party-gateway"
import { partiesFakes } from "../testing/parties-context"
import { provideParties } from "./context"
import PartyPage from "./PartyPage.svelte"

afterEach(cleanup)

// Found with two real browsers: an in-app party had controls but no video for them to drive.
const player = createRawSnippet((party: () => Party) => ({
  render: () => `<p>Player for ${party().title}</p>`,
}))

function setup(source: Party["source"]) {
  const fakes = partiesFakes("me")
  fakes.gateway.parties.set("p1", partyOf("p1", "me", { source }))
  const provide = () => provideParties(fakes.context)
  const props = { spaceId: SPACE, partyId: "p1", me: "me", itemHref: () => "#/i", player }
  render(Provided, { props: { provide, component: PartyPage, props } })
}

describe("PartyPage player", () => {
  it("shows the in-app player for an in-app party, so the party has a video to drive", async () => {
    setup("jellyfin")
    expect(await screen.findByText("Player for Severance")).toBeInTheDocument()
  })

  it("shows no player when you watch on Netflix or somewhere else", async () => {
    for (const source of ["netflix", "external"] as const) {
      setup(source)
      await screen.findByRole("heading", { name: "Watch party" })
      expect(screen.queryByText(/Player for/)).toBeNull()
      cleanup()
    }
  })
})
