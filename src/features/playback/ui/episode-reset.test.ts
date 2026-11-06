import { cleanup, fireEvent, screen, waitFor } from "@testing-library/svelte"
import { afterEach, expect, it } from "vitest"
import { ok } from "@/shared/domain"
import { fileSource } from "../testing/render-player"
import { renderTitlePlayback } from "./title-playback.test-setup"
afterEach(cleanup)

it("starts the following episode from its own first source after a fallback", async () => {
  const sources = [
    fileSource("https://example.org/broken.mp4"),
    fileSource("https://example.org/fallback.mp4"),
  ]
  renderTitlePlayback(
    sources,
    {
      spaceId: "s",
      itemId: "i",
      catalog: { type: "tv", id: 1399 },
    },
    {},
    { nextUp: async () => ok({ season: 1, episode: 2, title: "Second" }) },
  )
  await fireEvent.click(await screen.findByRole("button", { name: "Play S1 E1: Pilot" }))
  await waitFor(() => expect(document.querySelector("video")).not.toBeNull())
  await fireEvent.error(document.querySelector("video")!)
  await waitFor(() =>
    expect(document.querySelector("video")?.src).toBe("https://example.org/fallback.mp4"),
  )
  sources.splice(0, 2, fileSource("https://example.org/episode-two.mp4"))
  await fireEvent.click(await screen.findByRole("button", { name: "Next episode" }))
  await waitFor(() =>
    expect(document.querySelector("video")?.src).toBe("https://example.org/episode-two.mp4"),
  )
})
