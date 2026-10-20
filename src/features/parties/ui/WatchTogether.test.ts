import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { ITEM, partyOf, SPACE } from "../testing/fake-party-gateway"
import { partiesFakes } from "../testing/parties-context"
import { provideParties } from "./context"
import WatchTogether from "./WatchTogether.svelte"

afterEach(cleanup)

function setup(isFilm = false, fakes = partiesFakes()) {
  const provide = () => provideParties(fakes.context)
  const props = { spaceId: SPACE, itemId: ITEM, isFilm }
  render(Provided, { props: { provide, component: WatchTogether, props } })
  return fakes
}

describe("WatchTogether", () => {
  it("invites to the episode after the together pointer, in the app by default", async () => {
    const fakes = partiesFakes()
    fakes.gateway.togetherAt = { at: { season: 2, episode: 3 } }
    setup(false, fakes)
    await fireEvent.click(await screen.findByRole("button", { name: "Watch together" }))
    await waitFor(() => expect(screen.getByLabelText("From episode")).toHaveValue(4))
    expect(screen.getByLabelText("From season")).toHaveValue(2)
    expect(screen.getByLabelText("In the app")).toBeChecked()
    await fireEvent.click(screen.getByRole("button", { name: "Start the party" }))
    await waitFor(() => expect(window.location.hash).toBe(`#/s/${SPACE}/party/party-1`))
    expect(fakes.gateway.calls).toContainEqual([
      "start",
      {
        watchItemId: ITEM,
        source: "jellyfin",
        range: { from: { season: 2, episode: 4 }, to: { season: 2, episode: 4 } },
      },
    ])
  })

  it("starts a co-watch of a film with no episodes to pick", async () => {
    const fakes = setup(true)
    await fireEvent.click(await screen.findByRole("button", { name: "Watch together" }))
    expect(screen.queryByLabelText("From season")).toBeNull()
    await fireEvent.click(screen.getByLabelText("Somewhere else (a TV, another app)"))
    await fireEvent.click(screen.getByRole("button", { name: "Start the party" }))
    await waitFor(() =>
      expect(fakes.gateway.calls).toContainEqual([
        "start",
        { watchItemId: ITEM, source: "external", range: null },
      ]),
    )
  })

  it("asks for a season's length when the range crosses into the next", async () => {
    setup()
    await fireEvent.click(await screen.findByRole("button", { name: "Watch together" }))
    await fireEvent.input(screen.getByLabelText("To season"), { target: { value: "2" } })
    expect(await screen.findByLabelText("Episodes in season 1")).toBeInTheDocument()
    await fireEvent.click(screen.getByRole("button", { name: "Start the party" }))
    expect(
      await screen.findByText("Each season the party leaves needs its episode count"),
    ).toBeInTheDocument()
  })

  it("offers to join the party already open for this title", async () => {
    const fakes = partiesFakes()
    fakes.gateway.parties.set("p9", partyOf("p9", "lindi"))
    setup(false, fakes)
    const join = await screen.findByRole("link", { name: "Join the watch party" })
    expect(join).toHaveAttribute("href", `#/s/${SPACE}/party/p9`)
    expect(screen.queryByRole("button", { name: "Watch together" })).toBeNull()
  })
})
