import { describe, expect, it } from "vitest"
import { detectFormat } from "./format"

describe("detectFormat", () => {
  it.each([
    ["https://a.org/x/master.m3u8", "hls"],
    ["https://a.org/x/Manifest.MPD?t=1", "dash"],
    ["https://a.org/x/film.mp4", "file"],
    ["https://a.org/x/film.webm", "file"],
    ["https://a.org/x/film.m4v", "file"],
  ])("reads %s as %s from the path", (url, kind) => {
    expect(detectFormat(url)).toBe(kind)
  })

  it.each([
    ["application/vnd.apple.mpegurl", "hls"],
    ["application/x-mpegURL; charset=utf-8", "hls"],
    ["application/dash+xml", "dash"],
    ["video/mp4", "file"],
    ["video/webm", "file"],
  ])("prefers the content type %s", (type, kind) => {
    expect(detectFormat("https://a.org/stream", type)).toBe(kind)
  })

  it("answers null when neither tells", () => {
    expect(detectFormat("https://a.org/stream")).toBeNull()
    expect(detectFormat("https://a.org/stream", "text/html")).toBeNull()
    expect(detectFormat("not a url")).toBeNull()
  })
})
