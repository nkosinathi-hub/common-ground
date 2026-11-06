import { cleanup, fireEvent, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import type { PlayTarget } from "../application/ports"
import { fileSource } from "../testing/render-player"
import { renderTitlePlayback } from "./title-playback.test-setup"

afterEach(cleanup)

describe("series playback choices", () => {
  it("shows episodes immediately and changes season without opening a menu", async () => {
    const { asked } = renderTitlePlayback([], {
      spaceId: "s",
      itemId: "show",
      catalog: { type: "tv", id: 1399 },
    })
    expect(await screen.findByRole("heading", { name: "Episodes" })).toBeVisible()
    expect(await screen.findByRole("button", { name: "Play S1 E2: Second Episode" })).toBeVisible()
    await fireEvent.change(screen.getByRole("combobox", { name: "Season" }), {
      target: { value: "2" },
    })
    await fireEvent.click(await screen.findByRole("button", { name: "Play S2 E1: New Season" }))
    await waitFor(() => expect(asked.at(-1)).toMatchObject({ season: 2, episode: 1 }))
    expect(screen.getByRole("heading", { name: "Episodes" })).toBeVisible()
  })

  it("picks another season's episode and plays it straight away", async () => {
    const show: PlayTarget = {
      spaceId: "s",
      itemId: "show",
      catalog: { type: "tv", id: 1399 },
    }
    const { asked } = renderTitlePlayback([fileSource("https://a.example.org/episode.mp4")], show)
    await screen.findByRole("button", { name: "S1 E1 · Pilot" })
    await fireEvent.click(screen.getByRole("button", { name: "Play an episode" }))
    await fireEvent.click(await screen.findByRole("button", { name: "Season 2" }))
    await fireEvent.click(
      (await screen.findAllByRole("button", { name: "Play S2 E1: New Season" }))[0]!,
    )
    await waitFor(() =>
      expect(asked.at(-1)).toMatchObject({ kind: "episode", season: 2, episode: 1 }),
    )
  })
})
