import { describe, expect, it } from "vitest"
import { netflixSearchUrl } from "./netflix"

describe("netflixSearchUrl (#66)", () => {
  it("searches netflix.com for the title, with nothing else in the link", () => {
    expect(netflixSearchUrl("Severance")).toBe("https://www.netflix.com/search?q=Severance")
    expect(netflixSearchUrl("Love & Death ")).toBe(
      "https://www.netflix.com/search?q=Love%20%26%20Death",
    )
  })
})
