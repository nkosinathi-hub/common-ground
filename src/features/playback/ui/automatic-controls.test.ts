import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { tick } from "svelte"
import { afterEach, expect, it, vi } from "vitest"
import SkipButton from "./SkipButton.svelte"
import NextUpCountdown from "./NextUpCountdown.svelte"
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
it("offers intro skipping and automatically skips a known intro exactly once", async () => {
  vi.useFakeTimers()
  const onskip = vi.fn()
  render(SkipButton, {
    segments: [{ kind: "intro", start: 10, end: 25 }],
    time: 12,
    auto: true,
    onskip,
  })
  expect(screen.getByRole("button", { name: /Skip intro/ })).toBeVisible()
  await vi.advanceTimersByTimeAsync(3000)
  await tick()
  expect(onskip).toHaveBeenCalledExactlyOnceWith(25)
  await vi.advanceTimersByTimeAsync(10_000)
  expect(onskip).toHaveBeenCalledOnce()
})
it("shows Next episode before credits and does not duplicate manual and timed advancement", async () => {
  vi.useFakeTimers()
  const onplay = vi.fn()
  const next = { season: 2, episode: 1, title: "Return" }
  const view = render(NextUpCountdown, { next, due: false, onplay })
  expect(screen.getByRole("button", { name: "Next episode" })).toBeVisible()
  await view.rerender({ next, due: true, onplay })
  await fireEvent.click(screen.getByRole("button", { name: "Play now" }))
  await vi.advanceTimersByTimeAsync(15_000)
  expect(onplay).toHaveBeenCalledExactlyOnceWith(next)
})
it("advances autonomously at the end and allows cancellation", async () => {
  vi.useFakeTimers()
  const onplay = vi.fn()
  render(NextUpCountdown, { next: { season: 1, episode: 2, title: "Second" }, due: true, onplay })
  await vi.advanceTimersByTimeAsync(10_000)
  expect(onplay).toHaveBeenCalledOnce()
})
