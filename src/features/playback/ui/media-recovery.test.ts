import { afterEach, expect, it, vi } from "vitest"
import { watchMedia, pauseToPreserve } from "./media-recovery"
afterEach(() => vi.useRealTimers())
it("recovers stalled playback once but never treats a pause as failure", () => {
  vi.useFakeTimers()
  const video = document.createElement("video")
  Object.defineProperty(video, "paused", { value: false, configurable: true })
  const fail = vi.fn()
  const dispose = watchMedia(video, fail, 1000)
  video.dispatchEvent(new Event("waiting"))
  video.dispatchEvent(new Event("stalled"))
  vi.advanceTimersByTime(500)
  video.dispatchEvent(new Event("timeupdate"))
  vi.advanceTimersByTime(500)
  expect(fail).toHaveBeenCalledOnce()
  Object.defineProperty(video, "paused", { value: true })
  video.dispatchEvent(new Event("waiting"))
  vi.advanceTimersByTime(2000)
  expect(fail).toHaveBeenCalledOnce()
  dispose()
})

it("detects a decoded video that silently stops progressing without waiting events", () => {
  vi.useFakeTimers()
  const video = document.createElement("video")
  Object.defineProperties(video, { paused: { value: false }, readyState: { value: 4 } })
  video.currentTime = 3.59
  const fail = vi.fn()
  const dispose = watchMedia(video, fail, 1000)
  vi.advanceTimersByTime(2000)
  expect(fail).toHaveBeenCalledOnce()
  dispose()
})
it("does not confuse initial loading with an intentional pause", () => {
  const video = document.createElement("video")
  expect(pauseToPreserve(video, true)).toBe(false)
  Object.defineProperty(video, "readyState", { value: 4 })
  video.currentTime = 30
  expect(pauseToPreserve(video, true)).toBe(true)
  expect(pauseToPreserve(video, false)).toBe(false)
})
