import { describe, expect, it } from "vitest"
import { authorization, withoutToken } from "./client"
import { deviceProfile } from "./device-profile"
import { itemsOf } from "./items"
import { jellyfinPlugin } from "./plugin"

describe("jellyfin client helpers", () => {
  it("builds the MediaBrowser header, with the token only when signed in", () => {
    expect(authorization("d1")).toBe(
      'MediaBrowser Client="Common Ground", Device="Web", DeviceId="d1", Version="0.5.0"',
    )
    expect(authorization("d1", "t")).toMatch(/, Token="t"$/)
  })

  it("strips every credential parameter from a URL and keeps the rest", () => {
    const url = "https://jf.example.org/v/master.m3u8?a=1&api_key=x&ApiKey=y&access_token=z"
    expect(withoutToken(url)).toBe("https://jf.example.org/v/master.m3u8?a=1")
  })

  it("keeps only well-formed items", () => {
    expect(itemsOf({ Items: [{ Id: "a", Type: "Movie" }, { Id: 3 }, null] })).toHaveLength(1)
    expect(itemsOf(null)).toEqual([])
  })
})

describe("deviceProfile", () => {
  it("lists only the codecs the device reports, and burns in image subtitles", () => {
    const probe = (type: string) => type.includes("avc1") || type.includes("mp4a")
    const profile = deviceProfile(probe, 8_000_000)
    expect(profile.MaxStreamingBitrate).toBe(8_000_000)
    expect(profile.DirectPlayProfiles).toEqual([
      expect.objectContaining({ VideoCodec: "h264", AudioCodec: "aac" }),
    ])
    expect(profile.SubtitleProfiles).toContainEqual({ Format: "pgssub", Method: "Encode" })
    expect(profile.SubtitleProfiles).toContainEqual({ Format: "subrip", Method: "External" })
  })

  it("adds WebM direct play when VP9 decodes", () => {
    const profile = deviceProfile((type) => type.includes("vp9"), 1)
    expect(profile.DirectPlayProfiles).toHaveLength(2)
  })
})

describe("jellyfinPlugin", () => {
  const plugin = jellyfinPlugin("https://jf.example.org/", () => true)

  it("declares exactly the build's server for connect, media and subtitles, no frames", () => {
    expect(plugin.security).toMatchObject({
      connect: ["https://jf.example.org"],
      media: ["https://jf.example.org"],
      subtitles: ["https://jf.example.org"],
      frames: [],
    })
  })

  it("accepts only the build's server as options", () => {
    expect(plugin.validateOptions({ serverUrl: "https://jf.example.org/" }).ok).toBe(true)
    expect(plugin.validateOptions({ serverUrl: "https://other.example.org" }).ok).toBe(false)
    expect(plugin.validateOptions(null).ok).toBe(false)
  })

  it("refuses a wildcard or a non-origin at build time", () => {
    expect(() => jellyfinPlugin("https://*.example.org", () => true)).toThrow(/exact/)
    expect(() => jellyfinPlugin("https://jf.example.org/path", () => true)).toThrow(/exact/)
  })
})
