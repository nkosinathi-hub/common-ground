import { describe, expect, it } from "vitest"
import { titleIdFrom } from "./netflix-title"

describe("titleIdFrom", () => {
  it("reads the Netflix title id from a watch page's address", () => {
    expect(titleIdFrom("/watch/81234567")).toBe("81234567")
    expect(titleIdFrom("/watch/81234567/")).toBe("81234567")
  })

  it("is null anywhere but a watch page", () => {
    for (const path of ["/browse", "/search", "/title/81234567", "/watch/", "/watch/abc"])
      expect(titleIdFrom(path)).toBeNull()
  })
})
