import { describe, expect, it } from "vitest"
import { detailsPath, mapDetails } from "./details.ts"

describe("detailsPath", () => {
  it("asks for details and watch providers in one request", () => {
    expect(detailsPath("tv", 1429)).toBe(
      "tv/1429?language=en-US&append_to_response=watch/providers",
    )
  })
})

describe("mapDetails", () => {
  it("maps the title and its appended providers", () => {
    const details = mapDetails(
      {
        id: 1429,
        name: "Attack on Titan",
        original_language: "ja",
        genres: [{ id: 16, name: "Animation" }],
        "watch/providers": { results: { ZA: { flatrate: [{ provider_name: "Crunchyroll" }] } } },
      },
      "tv",
    )
    expect(details.title).toMatchObject({ id: 1429, mediaKind: "anime" })
    expect(details.availability.fallback).toBe(false)
    expect(details.availability.regions[0]?.categories[0]?.providers).toEqual(["Crunchyroll"])
  })

  it("treats missing providers as no availability anywhere", () => {
    expect(mapDetails({ id: 5, title: "X" }, "movie").availability).toEqual({
      regions: [],
      fallback: true,
    })
  })
})
