import { describe, expect, it } from "vitest"
import { mapTitle } from "./map-title.ts"

describe("mapTitle", () => {
  it("maps a movie from a search result", () => {
    const raw = {
      id: 438631,
      title: "Dune",
      release_date: "2021-09-15",
      overview: "Paul Atreides...",
      poster_path: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
      original_language: "en",
      genre_ids: [878, 12],
    }
    expect(mapTitle(raw, "movie")).toEqual({
      id: 438631,
      type: "movie",
      title: "Dune",
      year: 2021,
      mediaKind: "movie",
      posterPath: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
      synopsis: "Paul Atreides...",
    })
  })

  it("maps a tv show to series using name and first_air_date", () => {
    const title = mapTitle({ id: 1, name: "Shogun", first_air_date: "2024-02-27" }, "tv")
    expect(title).toMatchObject({ title: "Shogun", year: 2024, mediaKind: "series" })
  })

  it("detects anime only when Japanese and animation together", () => {
    expect(mapTitle({ id: 1, original_language: "ja", genre_ids: [16] }, "tv").mediaKind).toBe(
      "anime",
    )
    expect(
      mapTitle({ id: 1, original_language: "ja", genres: [{ id: 16 }] }, "movie").mediaKind,
    ).toBe("anime")
    expect(mapTitle({ id: 1, original_language: "ja", genre_ids: [18] }, "tv").mediaKind).toBe(
      "series",
    )
    expect(mapTitle({ id: 1, original_language: "en", genre_ids: [16] }, "movie").mediaKind).toBe(
      "movie",
    )
  })

  it("falls back safely on missing or hostile fields", () => {
    const title = mapTitle(
      {
        id: 7,
        release_date: "0001-01-01",
        poster_path: "../../etc/passwd",
        overview: "x".repeat(6000),
      },
      "movie",
    )
    expect(title.title).toBe("Untitled")
    expect(title.year).toBeNull()
    expect(title.posterPath).toBeNull()
    expect(title.synopsis).toHaveLength(5000)
  })

  it("truncates very long titles", () => {
    expect(mapTitle({ id: 1, title: "a".repeat(400) }, "movie").title).toHaveLength(200)
  })
})
