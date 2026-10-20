import { beforeEach, describe, expect, it, vi } from "vitest"
import { fakeSource } from "../testing/fake-plugin"
import { attachShaka } from "./shaka"

type Filter = (type: number, request: { uris: string[]; headers: Record<string, string> }) => void

const fake = vi.hoisted(() => ({
  supported: true,
  failLoad: false,
  filters: [] as unknown[],
  loads: [] as unknown[][],
  tracks: [] as unknown[][],
  selected: [] as unknown[],
  destroyed: 0,
}))

vi.mock("shaka-player", () => {
  class Player {
    static isBrowserSupported = () => fake.supported
    attach = async () => {}
    getNetworkingEngine = () => ({ registerRequestFilter: (f: unknown) => fake.filters.push(f) })
    addEventListener = () => {}
    load = async (...args: unknown[]) => {
      fake.loads.push(args)
      if (fake.failLoad) throw new Error("load")
    }
    addTextTrackAsync = async (...args: unknown[]) => void fake.tracks.push(args)
    getTextTracks = () => [{ language: "eng" }, { language: "fre" }]
    selectTextTrack = (track: unknown) => void fake.selected.push(track)
    destroy = async () => void (fake.destroyed += 1)
  }
  return { default: { Player, polyfill: { installAll: () => {} } } }
})

beforeEach(() => {
  Object.assign(fake, { supported: true, failLoad: false, filters: [], loads: [], tracks: [] })
  Object.assign(fake, { selected: [], destroyed: 0 })
})

const source = {
  ...fakeSource("jf", "jf"),
  url: "https://jf.example.org/master.m3u8",
  requestHeaders: { Authorization: 'MediaBrowser Token="t"' },
  resumeSeconds: 42,
  subtitles: [{ url: "https://jf.example.org/en.vtt", language: "eng", label: "English" }],
}

describe("attachShaka", () => {
  it("loads at the resume point, adds VTT tracks, and sends headers only to the source origin", async () => {
    const video = document.createElement("video")
    const handle = await attachShaka(video, source, vi.fn())
    expect(fake.loads).toEqual([["https://jf.example.org/master.m3u8", 42, null]])
    expect(fake.tracks[0]).toEqual([
      "https://jf.example.org/en.vtt",
      "eng",
      "subtitles",
      "text/vtt",
      undefined,
      "English",
    ])
    const filter = fake.filters[0] as Filter
    const own = { uris: ["https://jf.example.org/seg1.m4s"], headers: {} }
    const other = { uris: ["https://cdn.example.org/seg1.m4s"], headers: {} }
    filter(1, own)
    filter(1, other)
    expect(own.headers).toEqual(source.requestHeaders)
    expect(other.headers).toEqual({})
    handle.setCaptions(true, "fre")
    handle.setCaptions(false, null)
    expect(fake.selected).toEqual([{ language: "fre" }, null])
    handle.destroy()
    expect(fake.destroyed).toBe(1)
  })

  it("plays a header-carrying file through shaka with its MIME type", async () => {
    await attachShaka(
      document.createElement("video"),
      { ...source, kind: "file", mime: "video/mp4" },
      vi.fn(),
    )
    expect(fake.loads[0]?.[2]).toBe("video/mp4")
  })

  it("reports a failure when the browser cannot run shaka or the load fails", async () => {
    const onError = vi.fn()
    fake.supported = false
    await attachShaka(document.createElement("video"), source, onError)
    fake.supported = true
    fake.failLoad = true
    await attachShaka(document.createElement("video"), source, onError)
    expect(onError).toHaveBeenCalledTimes(2)
  })
})
