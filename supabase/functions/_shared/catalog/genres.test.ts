import { describe, expect, it } from "vitest"
import { canonicalGenres, tmdbGenreIds } from "./genres.ts"

describe("canonical genres", () => {
  it("folds film and series genres into one set", () => {
    expect(canonicalGenres([28])).toEqual(["action"])
    expect(canonicalGenres([10759, 18])).toEqual(["action", "adventure", "drama"])
    expect(canonicalGenres([10765, 878])).toEqual(["fantasy", "scifi"])
    expect(canonicalGenres([10767, "x", 99999])).toEqual([])
  })

  it("asks discover with each type's own ids", () => {
    expect(tmdbGenreIds("action", "movie")).toEqual([28])
    expect(tmdbGenreIds("action", "tv")).toEqual([10759])
    expect(tmdbGenreIds("war", "tv")).toEqual([10768])
    expect(tmdbGenreIds("music", "tv")).toEqual([])
  })
})
