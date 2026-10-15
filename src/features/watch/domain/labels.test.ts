import { describe, expect, it } from "vitest"
import { fromCatalog } from "./catalog"
import { intentLabel, mediaTypeLabel, progressSummary, statusLabel } from "./labels"

describe("labels", () => {
  it("names every option", () => {
    expect(mediaTypeLabel("anime")).toBe("Anime")
    expect(intentLabel("watch_together")).toBe("Watch together")
    expect(statusLabel("dropped")).toBe("Dropped")
    expect(statusLabel("x" as never)).toBe("x")
  })

  it("summarises progress", () => {
    const base = { status: "watching", season: null, episode: null, rating: null } as const
    expect(progressSummary(base)).toBe("Watching")
    expect(progressSummary({ ...base, season: 2, episode: 4, rating: 4 })).toBe(
      "Watching, season 2 episode 4, 4/5",
    )
    expect(progressSummary({ ...base, episode: 0 })).toBe("Watching, episode 0")
  })
})

describe("fromCatalog", () => {
  it("maps a catalog result to an add request", () => {
    const pick = fromCatalog({
      id: 1,
      type: "tv",
      title: "Frieren",
      year: 2023,
      mediaKind: "anime",
      posterPath: "/f.jpg",
      synopsis: "Elf.",
    })
    expect(pick).toEqual({
      catalog: { type: "tv", id: 1 },
      title: "Frieren",
      mediaType: "anime",
      releaseYear: 2023,
      synopsis: "Elf.",
      posterPath: "/f.jpg",
    })
  })
})
