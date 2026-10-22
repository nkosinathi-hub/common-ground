import { describe, expect, it } from "vitest"
import { seekReply, seekRequest } from "./bridge"
import { installSeekHandler, seekNetflix } from "./page-seek"
import { fakeNetflixPage } from "./testing/fake-netflix"

describe("the MAIN-world page script", () => {
  it("seeks through Netflix's own player API, in milliseconds", () => {
    const { win, seeks, video } = fakeNetflixPage(["motion-billboard", "watch-1"])
    expect(seekNetflix(win, 90_500)).toBe(true)
    expect(seeks).toEqual([90_500])
    expect(video.currentTime).toBe(90.5)
    expect(video.broken).toBe(false)
  })

  it("says so when the page has no Netflix player", () => {
    expect(seekNetflix({}, 1000)).toBe(false)
    expect(seekNetflix({ netflix: { appContext: null } }, 1000)).toBe(false)
    expect(seekNetflix(fakeNetflixPage([]).win, 1000)).toBe(false)
    const throwing = { netflix: { appContext: { state: { playerApp: { getAPI: () => 1 } } } } }
    expect(seekNetflix(throwing, 1000)).toBe(false)
  })

  it("answers a seek from the bridge, and nothing else", () => {
    const { win, seeks } = fakeNetflixPage()
    const stop = installSeekHandler(win)
    win.postMessage(seekRequest(7, 2000), "https://www.netflix.com")
    win.postMessage({ ...seekRequest(8, 3000), channel: "else" }, "https://www.netflix.com")
    expect(seeks).toEqual([2000])
    expect(win.posted.at(-2)).toEqual({
      message: seekReply(7, true),
      origin: "https://www.netflix.com",
    })
    stop()
    win.postMessage(seekRequest(9, 4000), "https://www.netflix.com")
    expect(seeks).toEqual([2000])
  })
})
