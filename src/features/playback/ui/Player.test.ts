import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ok } from "@/shared/domain"
import Provided from "@/shared/ui/testing/Provided.svelte"
import type { PlayableSource } from "../domain/source.types"
import { fileSource, playerFakes } from "../testing/render-player"
import { providePlayback } from "./context"
import Player from "./Player.svelte"

afterEach(cleanup)

const show = { spaceId: "s", itemId: "i", catalog: { type: "tv", id: 1399 } } as const
const ref = { kind: "episode", tmdbId: 1399, season: 1, episode: 2 } as const
const track = { url: "https://a.example.org/en.vtt", language: "eng", label: "English" }

function setup(source: PlayableSource) {
  const nextUp = vi.fn(async () => ok({ season: 1, episode: 3, title: "Three" }))
  const fakes = playerFakes([source], { nextUp })
  const onnext = vi.fn()
  const props = {
    playing: { ref, sources: [source] },
    target: show,
    title: "Show",
    onclose: () => {},
    onnext,
  }
  render(Provided, { props: { provide: () => providePlayback(fakes), component: Player, props } })
  return { ...fakes, onnext, video: () => document.querySelector("video") as HTMLVideoElement }
}

describe("Player", () => {
  it("answers m, j and l from the keyboard, and remembers the caption choice", async () => {
    const { video, device } = setup(
      fileSource("https://a.example.org/1.mp4", { subtitles: [track] }),
    )
    const player = screen.getByRole("region", { name: "Player: Show" })
    await fireEvent.keyDown(player, { key: "m" })
    expect(video().muted).toBe(true)
    video().currentTime = 30
    await fireEvent.keyDown(player, { key: "j" })
    expect(video().currentTime).toBe(20)
    await fireEvent.keyDown(player, { key: "l" })
    expect(video().currentTime).toBe(30)
    await fireEvent.keyDown(player, { key: "c" })
    expect(JSON.parse(device.data.get("playback-captions") ?? "{}")).toEqual({
      on: true,
      language: "eng",
    })
    expect(screen.getByRole("button", { name: "Turn captions off" })).toBeInTheDocument()
  })

  it("marks the episode watched at 90 percent, once", async () => {
    const { video, watched } = setup(fileSource("https://a.example.org/1.mp4"))
    Object.defineProperty(video(), "duration", { value: 100 })
    video().currentTime = 91
    await fireEvent(video(), new Event("timeupdate"))
    await fireEvent(video(), new Event("timeupdate"))
    await waitFor(() => expect(watched).toEqual([ref]))
  })

  it("counts down to the next episode in the credits, and plays it on request", async () => {
    const credits = [{ kind: "credits", start: 50, end: 60 }] as const
    const { video, onnext } = setup(
      fileSource("https://a.example.org/1.mp4", { segments: [...credits] }),
    )
    video().currentTime = 55
    await fireEvent(video(), new Event("timeupdate"))
    expect(await screen.findByText(/Next up, S1E3: Three, in 10 s/)).toBeInTheDocument()
    await fireEvent.click(screen.getByRole("button", { name: "Play now" }))
    expect(onnext).toHaveBeenCalledWith({ season: 1, episode: 3 })
  })

  it("keeps controls on the page in theatre mode", async () => {
    setup(fileSource("https://a.example.org/1.mp4"))
    await fireEvent.click(screen.getByRole("button", { name: "Theatre mode" }))
    expect(screen.getByRole("region", { name: "Player: Show" }).className).toContain("fixed")
    expect(screen.getByRole("button", { name: "Leave theatre mode" })).toBeInTheDocument()
  })
})
