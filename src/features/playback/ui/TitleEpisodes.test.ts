import { cleanup, fireEvent, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import { appError, err, ok } from "@/shared/domain"
import { fileSource } from "../testing/render-player"
import { renderTitlePlayback } from "./title-playback.test-setup"

afterEach(cleanup)
const show = { spaceId: "s", itemId: "i", catalog: { type: "tv", id: 1399 } } as const

describe("visible episode browser", () => {
  it("plays directly from a visible row while keeping the episode choices", async () => {
    const { asked } = renderTitlePlayback([fileSource("https://a.example.org/episode.mp4")], show)
    await fireEvent.click(await screen.findByRole("button", { name: "Play S1 E2: Second Episode" }))
    await waitFor(() => expect(document.querySelector("video")).not.toBeNull())
    expect(asked).toEqual([{ kind: "episode", tmdbId: 1399, season: 1, episode: 2 }])
    expect(screen.getByRole("heading", { name: "Episodes" })).toBeVisible()
    await waitFor(() => expect(screen.getByRole("region", { name: "Player: Film" })).toHaveFocus())
  })

  it("retries a failed catalog load and restores the visible episodes", async () => {
    const details = vi
      .fn()
      .mockResolvedValueOnce(err(appError("network", "Episode list is unavailable")))
      .mockResolvedValue(
        ok({
          trailerAvailable: false,
          seasons: [{ number: 1, name: "Season 1", episodeCount: 1 }],
        }),
      )
    renderTitlePlayback([], show, { details })
    expect(await screen.findByRole("alert")).toHaveTextContent("Episode list is unavailable")
    await fireEvent.click(screen.getByRole("button", { name: "Retry episodes" }))
    expect(await screen.findByRole("button", { name: "Play S1 E1: Pilot" })).toBeVisible()
    expect(details).toHaveBeenCalledTimes(2)
  })

  it("explains empty seasons without hiding the season control", async () => {
    renderTitlePlayback([], show, { season: async () => ok({ episodes: [] }) })
    expect(await screen.findByText("No episodes are listed for this season yet.")).toBeVisible()
    expect(screen.getByRole("combobox", { name: "Season" })).toBeVisible()
  })

  it("does not show a season or episode section for films", async () => {
    renderTitlePlayback([], { ...show, catalog: { type: "movie", id: 603 } })
    await screen.findByRole("button", { name: "Watch trailer" })
    expect(screen.queryByRole("heading", { name: "Episodes" })).toBeNull()
    expect(screen.queryByRole("combobox", { name: "Season" })).toBeNull()
  })
})
