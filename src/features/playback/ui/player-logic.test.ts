import { describe, expect, it } from "vitest"
import { fakeSource } from "../testing/fake-plugin"
import { engineFor, headersFor, keyAction } from "./player-logic"

describe("engineFor", () => {
  it("plays HLS and DASH with shaka, embeds in an iframe, and plain files natively", () => {
    const source = fakeSource("a", "a")
    expect(engineFor(source)).toBe("shaka")
    expect(engineFor({ ...source, kind: "dash" })).toBe("shaka")
    expect(engineFor({ ...source, kind: "embed" })).toBe("embed")
    expect(engineFor({ ...source, kind: "file" })).toBe("video")
  })

  it("sends a file that needs headers through shaka, since <video> cannot send them", () => {
    const source = { ...fakeSource("a", "a"), kind: "file" as const, requestHeaders: { A: "b" } }
    expect(engineFor(source)).toBe("shaka")
  })
})

describe("headersFor", () => {
  const source = {
    ...fakeSource("a", "a"),
    url: "https://jf.example.org/master.m3u8",
    requestHeaders: { Authorization: "MediaBrowser Token=x" },
  }

  it("adds the source's headers only for its own origin", () => {
    expect(headersFor(source, "https://jf.example.org/seg1.m4s")).toEqual(source.requestHeaders)
    expect(headersFor(source, "https://cdn.example.org/seg1.m4s")).toEqual({})
    expect(headersFor(source, "not a url")).toEqual({})
    expect(headersFor(fakeSource("a", "a"), "https://a.example.org/x")).toEqual({})
  })
})

describe("keyAction", () => {
  it.each([
    [" ", "toggle"],
    ["k", "toggle"],
    ["j", "back"],
    ["l", "forward"],
    ["f", "fullscreen"],
    ["c", "captions"],
    ["m", "mute"],
    ["K", "toggle"],
    ["x", null],
  ])("maps %j to %s", (key, action) => {
    expect(keyAction(key)).toBe(action)
  })
})
