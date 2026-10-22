import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { netflixPlayer, pageSeeker } from "./netflix-player"
import { installSeekHandler } from "./page-seek"
import { fakeNetflixPage } from "./testing/fake-netflix"

beforeEach(() => void vi.useFakeTimers().setSystemTime(1_000_000))
afterEach(() => vi.useRealTimers())

function setup(sessionIds?: string[]) {
  const page = fakeNetflixPage(sessionIds)
  installSeekHandler(page.win)
  const failed = vi.fn()
  const player = netflixPlayer(page.page, pageSeeker(page.win, failed))
  return { ...page, player, failed }
}

describe("netflixPlayer, the PlayerControl over netflix.com", () => {
  it("plays, pauses and reads the position through the page's video", async () => {
    const { player, video } = setup()
    await player.play()
    vi.advanceTimersByTime(2000)
    expect(player.currentTime()).toBe(2)
    player.pause()
    expect(video.playing).toBe(false)
  })

  it("nudges the rate on the video", () => {
    const { player, video } = setup()
    player.setRate(1.05)
    expect(video.playbackRate).toBe(1.05)
  })

  it("seeks through Netflix's player API, never by setting currentTime", () => {
    const { player, video, seeks, win } = setup()
    player.seek(61.25)
    expect(seeks).toEqual([61_250])
    expect(video.currentTime).toBe(61.25)
    expect(video.broken).toBe(false)
    expect(win.posted[0]?.origin).toBe("https://www.netflix.com")
  })

  it("reports a seek the page could not make", () => {
    const { player, failed } = setup([])
    player.seek(10)
    expect(failed).toHaveBeenCalledOnce()
  })

  it("reports stalls and recovery, and stops when asked", () => {
    const { player, emit } = setup()
    const seen: boolean[] = []
    const stop = player.onBuffering((buffering) => seen.push(buffering))
    emit("waiting")
    emit("playing")
    stop()
    emit("waiting")
    expect(seen).toEqual([true, false])
  })

  it("does nothing harmful before the video exists", async () => {
    const { win } = fakeNetflixPage()
    const page = { video: () => null, on: () => () => undefined }
    const player = netflixPlayer(
      page,
      pageSeeker(win, () => undefined),
    )
    await expect(player.play()).rejects.toThrow(/No Netflix video/)
    player.pause()
    player.setRate(1.1)
    expect(player.currentTime()).toBe(0)
  })
})
