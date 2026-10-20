import { describe, expect, it } from "vitest"
import type { SecurityPolicy } from "./plugin.types"
import { EMPTY_POLICY } from "./policy"
import type { PlayableSource } from "./source.types"
import { validateSource } from "./validate-source"

const policy: SecurityPolicy = {
  ...EMPTY_POLICY,
  media: ["https://media.example.org"],
  frames: ["https://www.youtube-nocookie.com"],
  subtitles: ["https://subs.example.org"],
  sandbox: ["allow-scripts", "allow-same-origin"],
}

const source = (extra: Partial<PlayableSource> = {}): PlayableSource => ({
  kind: "hls",
  url: "https://media.example.org/master.m3u8",
  subtitles: [],
  segments: [],
  providerId: "a",
  ...extra,
})

describe("validateSource", () => {
  it("accepts a media source on a declared media origin", () => {
    expect(validateSource(source(), policy)).toEqual({ ok: true, value: source() })
  })

  it("refuses a media URL outside the media origins, even a declared frame origin", () => {
    const off = source({ url: "https://www.youtube-nocookie.com/embed/x" })
    expect(validateSource(off, policy)).toMatchObject({ ok: false, error: { field: "url" } })
    expect(validateSource(source({ url: "javascript:alert(1)" }), policy).ok).toBe(false)
  })

  it("checks embeds against frames and stamps the declared sandbox tokens", () => {
    const embed = source({ kind: "embed", url: "https://www.youtube-nocookie.com/embed/k" })
    const result = validateSource(embed, policy)
    expect(result).toMatchObject({
      ok: true,
      value: { sandbox: ["allow-scripts", "allow-same-origin"] },
    })
    const offFrame = source({ kind: "embed", url: "https://media.example.org/x" })
    expect(validateSource(offFrame, policy).ok).toBe(false)
  })

  it("refuses subtitles outside the subtitle and media origins", () => {
    const sub = (url: string) => source({ subtitles: [{ url, language: "en", label: "English" }] })
    expect(validateSource(sub("https://subs.example.org/en.vtt"), policy).ok).toBe(true)
    expect(validateSource(sub("https://media.example.org/en.vtt"), policy).ok).toBe(true)
    expect(validateSource(sub("https://evil.org/en.vtt"), policy)).toMatchObject({
      ok: false,
      error: { field: "subtitles" },
    })
  })

  it("refuses broken segments", () => {
    const seg = (start: number, end: number) =>
      source({ segments: [{ kind: "intro", start, end }] })
    expect(validateSource(seg(10, 70), policy).ok).toBe(true)
    expect(validateSource(seg(70, 10), policy)).toMatchObject({ error: { field: "segments" } })
    expect(validateSource(seg(-1, 10), policy).ok).toBe(false)
  })

  it("refuses a token in the URL", () => {
    const leaky = source({ url: "https://media.example.org/v.mp4?api_key=abc" })
    expect(validateSource(leaky, policy)).toMatchObject({ ok: false, error: { field: "url" } })
    const other = source({ url: "https://media.example.org/v.mp4?ApiKey=abc" })
    expect(validateSource(other, policy).ok).toBe(false)
  })
})
