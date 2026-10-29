import { cleanup, fireEvent, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import type { PlayTarget } from "../application/ports"
import type { PlayableSource } from "../domain/source.types"
import { fileSource } from "../testing/render-player"
import { renderTitlePlayback } from "./title-playback.test-setup"

afterEach(cleanup)

const movie = { spaceId: "s", itemId: "i", catalog: { type: "movie", id: 603 } } as const
const video = () => document.querySelector("video") as HTMLVideoElement
const embed: PlayableSource = {
  ...fileSource("https://www.youtube-nocookie.com/embed/m8e-FF8MsqU"),
  kind: "embed",
  providerId: "youtube-trailer",
  sandbox: ["allow-scripts", "allow-same-origin"],
}

describe("title playback", () => {
  it("plays the selected movie in an inline player", async () => {
    const { asked } = renderTitlePlayback([fileSource("https://a.example.org/film.mp4")], movie)
    await fireEvent.click(screen.getByRole("button", { name: "Play" }))
    await waitFor(() => expect(video()).not.toBeNull())
    expect(asked).toEqual([{ kind: "movie", tmdbId: 603 }])
    expect(video().getAttribute("src")).toBe("https://a.example.org/film.mp4")
    expect(video().hasAttribute("playsinline")).toBe(true)
  })

  it("offers a separate trailer action instead of silently falling back to one", async () => {
    renderTitlePlayback([fileSource("https://a.example.org/film.mp4"), embed], movie)
    await fireEvent.click(screen.getByRole("button", { name: "Play" }))
    expect(video().getAttribute("src")).toBe("https://a.example.org/film.mp4")
    await fireEvent.click(screen.getByRole("button", { name: "Watch trailer" }))
    expect(await screen.findByTitle("Film")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/m8e-FF8MsqU",
    )
  })

  it("shows a readable error when no title source works", async () => {
    renderTitlePlayback([], movie)
    await fireEvent.click(screen.getByRole("button", { name: "Play" }))
    expect(await screen.findByText(/Nothing can play this title/)).toBeInTheDocument()
  })

  it("keeps title playback out of the YouTube trailer provider", async () => {
    const show: PlayTarget = { ...movie, catalog: { type: "tv", id: 1399 } }
    const { asked } = renderTitlePlayback([fileSource("https://a.example.org/episode.mp4")], show)
    const next = await screen.findByRole("button", { name: "S1 E1 · Pilot" })
    await fireEvent.click(next)
    await waitFor(() => expect(asked[0]).toMatchObject({ kind: "episode", season: 1, episode: 1 }))
    await fireEvent.click(screen.getByRole("button", { name: "Close the player" }))
    expect(screen.getByRole("button", { name: "S1 E1 · Pilot" })).toBeInTheDocument()
  })
})
