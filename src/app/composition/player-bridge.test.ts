import { describe, expect, it, vi } from "vitest"
import { ActivePlayer } from "./player-bridge"

const play = vi.fn(() => Promise.resolve())
const pause = vi.fn()

function fakeVideo() {
  const video = document.createElement("video")
  Object.defineProperty(video, "currentTime", { value: 0, writable: true })
  video.play = play
  video.pause = pause
  return video
}

describe("ActivePlayer", () => {
  it("is empty until the player shows a video, and empty again when it closes", () => {
    const active = new ActivePlayer()
    expect(active.control()).toBeNull()
    const detach = active.attach(fakeVideo())
    expect(active.control()).not.toBeNull()
    detach()
    expect(active.control()).toBeNull()
  })

  it("drives the video the party engine asks it to", async () => {
    const active = new ActivePlayer()
    const video = fakeVideo()
    active.attach(video)
    const control = active.control()!
    await control.play()
    control.pause()
    control.seek(42)
    control.setRate(1.05)
    expect(play).toHaveBeenCalledOnce()
    expect(pause).toHaveBeenCalledOnce()
    expect(control.currentTime()).toBe(42)
    expect(video.playbackRate).toBe(1.05)
  })

  it("reports buffering from the video's waiting and playing events", () => {
    const active = new ActivePlayer()
    const video = fakeVideo()
    active.attach(video)
    const seen: boolean[] = []
    const stop = active.control()!.onBuffering((b) => seen.push(b))
    video.dispatchEvent(new Event("waiting"))
    video.dispatchEvent(new Event("playing"))
    stop()
    video.dispatchEvent(new Event("waiting"))
    expect(seen).toEqual([true, false])
  })

  it("ignores a stale detach after a newer video took over", () => {
    const active = new ActivePlayer()
    const first = active.attach(fakeVideo())
    active.attach(fakeVideo())
    first()
    expect(active.control()).not.toBeNull()
  })
})
