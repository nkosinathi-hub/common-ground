import { describe, expect, it } from "vitest"
import { toPlayableSources } from "./response"

const origin = "http://127.0.0.1:3000"

describe("CinePro response mapping", () => {
  it("maps Core proxy URLs, subtitles, quality, expiry and provider details", () => {
    const sources = toPlayableSources(
      {
        responseId: "response-1",
        expiresAt: "2026-10-22T12:00:00Z",
        sources: [
          {
            url: "/v1/proxy?data=abc",
            type: "hls",
            quality: "FHD",
            provider: { id: "p1", name: "Provider One" },
          },
          { url: `${origin}/v1/proxy?data=def`, type: "mkv", quality: "720p" },
        ],
        subtitles: [
          { url: "/v1/proxy?data=sub", label: "English", format: "vtt" },
          { url: "/v1/proxy?data=srt", label: "Deutsch", format: "srt" },
        ],
      },
      origin,
      "cinepro",
    )
    expect(sources).toHaveLength(2)
    expect(sources[0]).toEqual({
      kind: "hls",
      url: `${origin}/v1/proxy?data=abc`,
      quality: 1080,
      subtitles: [{ url: `${origin}/v1/proxy?data=sub`, label: "English", language: "English" }],
      segments: [],
      providerId: "cinepro",
      expiresAt: "2026-10-22T12:00:00Z",
      providerData: {
        responseId: "response-1",
        sourceProviderId: "p1",
        sourceProviderName: "Provider One",
      },
    })
    expect(sources[1]).toMatchObject({ kind: "file", mime: "video/x-matroska", quality: 720 })
    expect(sources[1]?.providerData).toEqual({ responseId: "response-1" })
  })

  it("drops unknown kinds, URLs off the Core origin (localhost included) and a bad expiry", () => {
    const sources = toPlayableSources(
      {
        expiresAt: "never",
        sources: [
          { url: "https://other.example/movie.m3u8", type: "hls" },
          { url: "http://localhost:3000/v1/proxy?data=abc", type: "hls" },
          { url: "/v1/proxy?data=abc", type: "unknown" },
          { url: "/v1/proxy?data=ok", type: "mp4", quality: "Auto" },
        ],
      },
      origin,
      "cinepro",
    )
    expect(sources).toEqual([
      {
        kind: "file",
        url: `${origin}/v1/proxy?data=ok`,
        subtitles: [],
        segments: [],
        providerId: "cinepro",
      },
    ])
  })

  it("answers nothing for a payload that is not a source response", () => {
    expect(toPlayableSources(null, origin, "cinepro")).toEqual([])
    expect(toPlayableSources({ sources: "none" }, origin, "cinepro")).toEqual([])
    expect(toPlayableSources({ sources: [null, 3] }, origin, "cinepro")).toEqual([])
  })
})
