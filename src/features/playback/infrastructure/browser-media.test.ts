import { afterEach, describe, expect, it, vi } from "vitest"
import { fakeSource } from "../testing/fake-plugin"
import { browserCanPlay, browserProbe } from "./browser-media"

afterEach(() => vi.unstubAllGlobals())

const withMse = (supported: (type: string) => boolean) =>
  vi.stubGlobal("MediaSource", { isTypeSupported: supported })

describe("browserProbe", () => {
  it("asks Media Source Extensions first", () => {
    withMse((type) => type.includes("avc1"))
    expect(browserProbe('video/mp4; codecs="avc1.640028"')).toBe(true)
    expect(browserProbe('video/mp4; codecs="hvc1"')).toBe(false)
  })

  it("falls back to ManagedMediaSource (iOS 17.1+) and then the video element", () => {
    vi.stubGlobal("MediaSource", undefined)
    vi.stubGlobal("ManagedMediaSource", { isTypeSupported: () => true })
    expect(browserProbe("video/mp4")).toBe(true)
    vi.stubGlobal("ManagedMediaSource", undefined)
    const canPlayType = vi.spyOn(HTMLMediaElement.prototype, "canPlayType").mockReturnValue("maybe")
    expect(browserProbe("video/mp4")).toBe(true)
    canPlayType.mockReturnValue("")
    expect(browserProbe("video/mp4")).toBe(false)
  })
})

describe("browserCanPlay", () => {
  it("plays embeds anywhere and streams wherever MSE exists", () => {
    vi.stubGlobal("MediaSource", undefined)
    vi.stubGlobal("ManagedMediaSource", undefined)
    vi.spyOn(HTMLMediaElement.prototype, "canPlayType").mockReturnValue("")
    expect(browserCanPlay({ ...fakeSource("a", "a"), kind: "embed" })).toBe(true)
    expect(browserCanPlay(fakeSource("a", "a"))).toBe(false)
    withMse(() => true)
    expect(browserCanPlay({ ...fakeSource("a", "a"), kind: "dash" })).toBe(true)
  })

  it("plays HLS natively (Safari) and files the element can decode", () => {
    vi.stubGlobal("MediaSource", undefined)
    vi.spyOn(HTMLMediaElement.prototype, "canPlayType").mockImplementation((t) =>
      t === "application/vnd.apple.mpegurl" || t === "video/mp4" ? "probably" : "",
    )
    expect(browserCanPlay(fakeSource("a", "a"))).toBe(true)
    expect(browserCanPlay({ ...fakeSource("a", "a"), kind: "dash" })).toBe(false)
    expect(browserCanPlay({ ...fakeSource("a", "a"), kind: "file" })).toBe(true)
    expect(browserCanPlay({ ...fakeSource("a", "a"), kind: "file", mime: "video/x-mkv" })).toBe(
      false,
    )
  })
})
