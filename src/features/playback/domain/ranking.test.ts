import { describe, expect, it } from "vitest"
import { rankSources } from "./ranking"
import type { PlayableSource } from "./source.types"

const src = (providerId: string, extra: Partial<PlayableSource> = {}): PlayableSource => ({
  kind: "hls",
  url: `https://${providerId}.org/${extra.quality ?? 0}.m3u8`,
  subtitles: [],
  segments: [],
  providerId,
  ...extra,
})

describe("rankSources", () => {
  const priority = { a: 1, b: 2 }

  it("puts what the device can play first, then priority, then quality", () => {
    const sources = [
      src("b", { quality: 1080 }),
      src("a", { quality: 480 }),
      src("a", { quality: 720 }),
      src("a", { kind: "dash", quality: 2160 }),
    ]
    const canPlay = (s: PlayableSource) => s.kind !== "dash"
    const ranked = rankSources(sources, priority, canPlay)
    expect(ranked.map((s) => [s.providerId, s.quality])).toEqual([
      ["a", 720],
      ["a", 480],
      ["b", 1080],
      ["a", 2160],
    ])
  })

  it("ranks an unknown quality below a known one and keeps ties in order", () => {
    const first = src("a", { url: "https://a.org/1" })
    const second = src("a", { url: "https://a.org/2" })
    const known = src("a", { quality: 360 })
    expect(rankSources([first, second, known], priority, () => true)).toEqual([
      known,
      first,
      second,
    ])
  })

  it("puts a provider without a priority last", () => {
    const ranked = rankSources([src("z"), src("b")], priority, () => true)
    expect(ranked.map((s) => s.providerId)).toEqual(["b", "z"])
  })
})
