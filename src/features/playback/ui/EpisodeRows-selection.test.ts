import { cleanup, fireEvent, screen } from "@testing-library/svelte"
import { afterEach, expect, it } from "vitest"
import { fileSource } from "../testing/render-player"
import { renderTitlePlayback } from "./title-playback.test-setup"
afterEach(cleanup)
it("distinguishes the playing episode from the suggested next episode", async () => {
  renderTitlePlayback([fileSource("https://a.example.org/episode.mp4")], {
    spaceId: "s",
    itemId: "i",
    catalog: { type: "tv", id: 1399 },
  })
  const row = await screen.findByRole("button", { name: "Play S1 E2: Second Episode" })
  await fireEvent.click(row)
  expect(row).toHaveAttribute("aria-current", "true")
  expect(row).toHaveTextContent("Playing")
  expect((await screen.findAllByText("S1 E2 · Second Episode")).length).toBeGreaterThan(0)
})
