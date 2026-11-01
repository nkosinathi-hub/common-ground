import { describe, expect, it } from "vitest"
import { subtitleVtt } from "./subtitle-file"
import { audioRank, languageCode } from "./language"
import { rankSources } from "./ranking"
import { fakeSource } from "../testing/fake-plugin"

describe("language and subtitle defaults", () => {
  it("prefers advertised English over unknown or a higher-quality Spanish dub", () => {
    const english = { ...fakeSource("a", "a", 720), audioLanguages: ["ita", "eng"] }
    const spanish = { ...fakeSource("a", "a", 2160), audioLanguages: ["spa"] }
    const original = { ...fakeSource("a", "a", 1080), audioLanguages: ["Original"] }
    expect(rankSources([spanish, original, english], { a: 1 }, () => true)).toEqual([
      english,
      original,
      spanish,
    ])
    expect(languageCode("EN_us")).toBe("en")
    expect(languageCode("English")).toBe("en")
    expect(audioRank([], "es")).toBe(1)
    expect(audioRank(["Spanish"], "es")).toBe(0)
  })

  it("converts SRT once and preserves WebVTT on a repeated conversion", () => {
    const converted = subtitleVtt(
      "own.srt",
      "\uFEFF1\r\n00:00:00,000 --> 00:00:01,000\r\nHello\r\n",
    )
    expect(converted).toEqual({
      ok: true,
      value: "WEBVTT\n\n1\n00:00:00.000 --> 00:00:01.000\nHello\n",
    })
    if (converted.ok) expect(subtitleVtt("own.vtt", converted.value)).toEqual(converted)
  })

  it("refuses other file types, binary input, and text with no cues", () => {
    for (const [name, text] of [
      ["a.exe", "text"],
      ["a.vtt", "WEBVTT"],
      ["a.srt", "\0"],
    ])
      expect(subtitleVtt(name!, text!).ok).toBe(false)
  })
})
