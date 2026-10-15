import { describe, expect, it } from "vitest"
import { mapSearch, searchPath } from "./search.ts"

describe("searchPath", () => {
  it("encodes the query and asks for one page without adult titles", () => {
    expect(searchPath("spirited away & co", 2)).toBe(
      "search/multi?query=spirited%20away%20%26%20co&page=2&include_adult=false&language=en-US",
    )
  })
})

describe("mapSearch", () => {
  it("keeps only movie and tv results with safe integer ids", () => {
    const page = mapSearch(
      {
        results: [
          { id: 1, media_type: "movie", title: "A" },
          { id: 2, media_type: "tv", name: "B" },
          { id: 3, media_type: "person", name: "C" },
          { id: "4", media_type: "movie", title: "D" },
        ],
        total_pages: 3,
      },
      1,
    )
    expect(page.results.map((r) => [r.id, r.type])).toEqual([
      [1, "movie"],
      [2, "tv"],
    ])
    expect(page).toMatchObject({ page: 1, totalPages: 3 })
  })

  it("caps total pages at 20 and tolerates junk", () => {
    expect(mapSearch({ results: [], total_pages: 500 }, 1).totalPages).toBe(20)
    expect(mapSearch({ results: "nope", total_pages: "x" }, 1)).toEqual({
      results: [],
      page: 1,
      totalPages: 0,
    })
    expect(mapSearch(null, 4)).toEqual({ results: [], page: 4, totalPages: 0 })
  })
})
