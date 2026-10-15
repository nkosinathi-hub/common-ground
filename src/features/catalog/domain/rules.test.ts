import { describe, expect, it } from "vitest"
import { mediaKindLabel, posterUrl, splitAvailability, validatePage, validateQuery } from "./rules"
import type { Region } from "./types"

const region = (code: string, name: string): Region => ({ code, name, link: null, categories: [] })

describe("posterUrl", () => {
  it("builds a TMDB image URL only for a plain poster path", () => {
    expect(posterUrl("/abc_1.jpg")).toBe("https://image.tmdb.org/t/p/w185/abc_1.jpg")
    expect(posterUrl("/abc.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg")
    expect(posterUrl(null)).toBeNull()
    expect(posterUrl("https://evil.example/x.jpg")).toBeNull()
    expect(posterUrl("/../x.jpg")).toBeNull()
  })
})

describe("splitAvailability", () => {
  it("separates South Africa from other countries", () => {
    const split = splitAvailability({
      regions: [region("ZA", "South Africa"), region("US", "US")],
      fallback: false,
    })
    expect(split.home?.code).toBe("ZA")
    expect(split.others.map((r) => r.code)).toEqual(["US"])
    expect(split.fallback).toBe(false)
  })

  it("has no home region when falling back", () => {
    const split = splitAvailability({ regions: [region("DE", "Germany")], fallback: true })
    expect(split.home).toBeNull()
    expect(split.others).toHaveLength(1)
    expect(split.fallback).toBe(true)
  })
})

describe("validateQuery", () => {
  it("trims and accepts 2 to 160 characters", () => {
    expect(validateQuery("  dune ")).toEqual({ ok: true, value: "dune" })
    expect(validateQuery("d").ok).toBe(false)
    expect(validateQuery("x".repeat(161)).ok).toBe(false)
  })

  it("accepts pages 1 to 20", () => {
    expect(validatePage(1).ok).toBe(true)
    expect(validatePage(21).ok).toBe(false)
    expect(validatePage(0).ok).toBe(false)
  })
})

describe("mediaKindLabel", () => {
  it("labels kinds for display", () => {
    expect([mediaKindLabel("movie"), mediaKindLabel("series"), mediaKindLabel("anime")]).toEqual([
      "Movie",
      "Series",
      "Anime",
    ])
  })
})
