import { describe, expect, it } from "vitest"
import { safeWatchLink } from "./links.ts"

describe("safeWatchLink", () => {
  it("keeps https links on the TMDB and JustWatch hosts", () => {
    expect(safeWatchLink("https://www.themoviedb.org/movie/1-dune/watch?locale=ZA")).toBe(
      "https://www.themoviedb.org/movie/1-dune/watch?locale=ZA",
    )
    expect(safeWatchLink("https://www.justwatch.com/za")).toBe("https://www.justwatch.com/za")
  })

  it("drops other hosts, other schemes and junk", () => {
    for (const bad of [
      "http://www.themoviedb.org/movie/1",
      "https://themoviedb.org.evil.example/x",
      "https://www.netflix.com/title/1",
      "javascript:alert(1)",
      "not a url",
      42,
      null,
      undefined,
    ]) {
      expect(safeWatchLink(bad)).toBeNull()
    }
  })
})
