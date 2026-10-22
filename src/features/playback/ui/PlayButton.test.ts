import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import type { PlayTarget } from "../application/ports"
import type { PlayableSource } from "../domain/source.types"
import { fileSource, playerFakes } from "../testing/render-player"
import { providePlayback } from "./context"
import PlayButton from "./PlayButton.svelte"

afterEach(cleanup)

const movie = { spaceId: "s", itemId: "i", catalog: { type: "movie", id: 603 } } as const
const embed: PlayableSource = {
  ...fileSource("https://www.youtube-nocookie.com/embed/m8e-FF8MsqU"),
  kind: "embed",
  sandbox: ["allow-scripts", "allow-same-origin"],
}

function setup(sources: PlayableSource[], target: PlayTarget = movie) {
  const fakes = playerFakes(sources)
  const provide = () => providePlayback(fakes)
  render(Provided, { props: { provide, component: PlayButton, props: { target, title: "Film" } } })
  return fakes
}

const video = () => document.querySelector("video") as HTMLVideoElement

describe("PlayButton and the player", () => {
  it("resolves on demand and plays the best source in a native, inline video", async () => {
    const { asked } = setup([fileSource("https://a.example.org/film.mp4")])
    await fireEvent.click(screen.getByRole("button", { name: "Play" }))
    await waitFor(() => expect(video()).not.toBeNull())
    expect(asked).toEqual([{ kind: "movie", tmdbId: 603 }])
    expect(video().getAttribute("src")).toBe("https://a.example.org/film.mp4")
    expect(video().hasAttribute("playsinline")).toBe(true)
    expect(video().hasAttribute("autoplay")).toBe(false)
  })

  it("moves to the next ranked source on a playback error, then to a sandboxed embed", async () => {
    setup([
      fileSource("https://a.example.org/1.mp4"),
      fileSource("https://a.example.org/2.mp4"),
      embed,
    ])
    await fireEvent.click(screen.getByRole("button", { name: "Play" }))
    await waitFor(() => expect(video()).not.toBeNull())
    await fireEvent.error(video())
    await waitFor(() => expect(video().getAttribute("src")).toBe("https://a.example.org/2.mp4"))
    await fireEvent.error(video())
    const frame = await screen.findByTitle("Film")
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts allow-same-origin")
    // Origin only: YouTube refuses an embed with no referrer at all (player error 153).
    expect(frame.getAttribute("referrerpolicy")).toBe("strict-origin")
    expect(frame.getAttribute("sandbox")).not.toContain("top-navigation")
  })

  it("says so when every source fails", async () => {
    setup([fileSource("https://a.example.org/1.mp4")])
    await fireEvent.click(screen.getByRole("button", { name: "Play" }))
    await waitFor(() => expect(video()).not.toBeNull())
    await fireEvent.error(video())
    expect(await screen.findByText(/None of the sources/)).toBeInTheDocument()
  })

  it("skips the intro from the source's segments", async () => {
    const segments = [{ kind: "intro", start: 5, end: 65 }] as const
    setup([fileSource("https://a.example.org/1.mp4", { segments: [...segments] })])
    await fireEvent.click(screen.getByRole("button", { name: "Play" }))
    await waitFor(() => expect(video()).not.toBeNull())
    video().currentTime = 10
    await fireEvent(video(), new Event("timeupdate"))
    await fireEvent.click(await screen.findByRole("button", { name: "Skip intro" }))
    expect(video().currentTime).toBe(65)
  })

  it("plays a series from S1E1 when there is no progress, and closes", async () => {
    const show = { ...movie, catalog: { type: "tv", id: 1399 } } as const
    const { asked } = setup([fileSource("https://a.example.org/1.mp4")], show)
    await fireEvent.click(screen.getByRole("button", { name: "Play next episode" }))
    await waitFor(() => expect(asked).toHaveLength(1))
    expect(asked[0]).toMatchObject({ kind: "episode", season: 1, episode: 1 })
    await fireEvent.click(await screen.findByRole("button", { name: "Close the player" }))
    expect(screen.getByRole("button", { name: "Play next episode" })).toBeInTheDocument()
  })
})
