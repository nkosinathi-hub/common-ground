import { describe, expect, it } from "vitest"
import { sameOriginUrl, sourceKind, sourceMime, sourceQuality, sourceSubtitles } from "./source"

const origin = "https://cinepro.example.org"

describe("CinePro source fields", () => {
  it("keeps only URLs on the Core origin, relative or absolute", () => {
    expect(sameOriginUrl("/v1/proxy?data=a", origin)).toBe(`${origin}/v1/proxy?data=a`)
    expect(sameOriginUrl(`${origin}/x.m3u8`, origin)).toBe(`${origin}/x.m3u8`)
    expect(sameOriginUrl("https://cinepro.example.org:8443/x", origin)).toBeNull()
    expect(sameOriginUrl("http://[bad", origin)).toBeNull()
    expect(sameOriginUrl("", origin)).toBeNull()
    expect(sameOriginUrl(42, origin)).toBeNull()
  })

  it("maps OMSS source types to the player's kinds and container types", () => {
    expect(["hls", "HLS", "index.m3u8"].map(sourceKind)).toEqual(["hls", "hls", "hls"])
    expect(["dash", "video.mpd"].map(sourceKind)).toEqual(["dash", "dash"])
    const files = ["mp4", "mkv", "webm", "http", "file"].map(sourceKind)
    expect(files).toEqual(["file", "file", "file", "file", "file"])
    expect(["embed", "iframe"].map(sourceKind)).toEqual(["embed", "embed"])
    expect([sourceKind("torrent"), sourceKind(null)]).toEqual([null, null])
    expect([sourceMime("mkv"), sourceMime("webm"), sourceMime("mp4"), sourceMime(1)]).toEqual([
      "video/x-matroska",
      "video/webm",
      undefined,
      undefined,
    ])
  })

  it("reads quality from OMSS labels, pixel heights and numbers", () => {
    const labels = ["8K", "4k", "QHD", "FHD", "HD", "SD"].map(sourceQuality)
    expect(labels).toEqual([4320, 2160, 1440, 1080, 720, 480])
    expect([sourceQuality("1080p"), sourceQuality(" 720P "), sourceQuality(2160)]).toEqual([
      1080, 720, 2160,
    ])
    const unknown = [sourceQuality("Auto"), sourceQuality(Number.NaN), sourceQuality({})]
    expect(unknown).toEqual([undefined, undefined, undefined])
  })

  it("keeps WebVTT subtitles on the Core origin and labels unnamed ones", () => {
    const tracks = sourceSubtitles(
      [
        { url: "/sub.vtt", label: "English", format: "vtt" },
        { url: "/sub.srt", label: "Deutsch", format: "srt" },
        { url: "https://elsewhere.example/sub.vtt", label: "Nope" },
        { url: "/plain.vtt" },
        null,
      ],
      origin,
    )
    expect(tracks).toEqual([
      { url: `${origin}/sub.vtt`, label: "English", language: "English" },
      { url: `${origin}/plain.vtt`, label: "Subtitles", language: "Subtitles" },
    ])
    expect(sourceSubtitles("none", origin)).toEqual([])
  })
})
