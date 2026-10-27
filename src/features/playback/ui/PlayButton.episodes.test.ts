import { cleanup, fireEvent, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import type { PlayTarget } from "../application/ports"
import { fileSource } from "../testing/render-player"
import { renderPlayButton } from "./PlayButton.test-setup"

afterEach(cleanup)

describe("series playback choices", () => {
  it("loads season episodes and plays the selected one", async () => {
    const show: PlayTarget = {
      spaceId: "s",
      itemId: "show",
      catalog: { type: "tv", id: 1399 },
    }
    const { asked } = renderPlayButton([fileSource("https://a.example.org/episode.mp4")], show)
    const season = await screen.findByRole("combobox", { name: "Season" })
    await screen.findByRole("option", { name: "Season 1 · 2 episodes" })
    await waitFor(() => expect(season).not.toBeDisabled())
    await fireEvent.change(season, { target: { value: "2" } })
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Episode" })).toHaveValue("1"))
    expect(screen.getByRole("option", { name: "Episode 1 · New Season" })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole("button", { name: "Watch S2 E1" }))
    await waitFor(() =>
      expect(asked.at(-1)).toMatchObject({ kind: "episode", season: 2, episode: 1 }),
    )
  })
})
