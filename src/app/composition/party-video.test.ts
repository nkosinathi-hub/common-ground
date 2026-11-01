import { describe, expect, it, vi } from "vitest"
import { partyVideo } from "./party-video"

function video() {
  const v = document.createElement("video")
  Object.defineProperties(v, {
    paused: { value: true, writable: true },
    readyState: { value: 4, writable: true },
    duration: { value: 100 },
  })
  v.play = async () => {
    Object.defineProperty(v, "paused", { value: false })
    queueMicrotask(() => v.dispatchEvent(new Event("play")))
  }
  v.pause = () => {
    Object.defineProperty(v, "paused", { value: true })
    queueMicrotask(() => v.dispatchEvent(new Event("pause")))
  }
  return v
}

describe("party video events", () => {
  it("suppresses remote changes and the Ready play/pause gesture without hiding user controls", async () => {
    const v = video(),
      player = partyVideo(v),
      action = vi.fn()
    const stop = player.onAction!(action)
    const armed = player.play()
    player.pause()
    await armed
    await Promise.resolve()
    expect(action).not.toHaveBeenCalled()
    await v.play()
    v.pause()
    await Promise.resolve()
    expect(action.mock.calls).toEqual([
      ["play", 0],
      ["pause", 0],
    ])
    player.seek(30)
    v.dispatchEvent(new Event("seeked"))
    expect(action).toHaveBeenCalledTimes(2)
    v.currentTime = 10
    v.dispatchEvent(new Event("seeked"))
    expect(action).toHaveBeenLastCalledWith("seek", 10)
    stop()
    v.dispatchEvent(new Event("play"))
    expect(action).toHaveBeenCalledTimes(3)
  })

  it("clears buffering while paused, bounds seeks and ignores invalid positions", () => {
    const v = video(),
      player = partyVideo(v),
      buffer = vi.fn()
    expect(player.isReady!()).toBe(true)
    const stop = player.onBuffering(buffer)
    v.dispatchEvent(new Event("waiting"))
    v.dispatchEvent(new Event("canplay"))
    expect(buffer.mock.calls).toEqual([[true], [false]])
    player.seek(Infinity)
    expect(v.currentTime).toBe(0)
    player.seek(1000)
    expect(v.currentTime).toBe(100)
    player.seek(-10)
    expect(v.currentTime).toBe(0)
    stop()
    v.dispatchEvent(new Event("waiting"))
    expect(buffer).toHaveBeenCalledTimes(2)
  })

  it("does not leak a failed play promise or suppress the next user gesture", async () => {
    const v = video(),
      player = partyVideo(v),
      action = vi.fn()
    player.onAction!(action)
    v.play = () => Promise.reject(new Error("gesture required"))
    await expect(player.play()).rejects.toThrow("gesture required")
    v.dispatchEvent(new Event("play"))
    expect(action).toHaveBeenCalledWith("play", 0)
  })
})
