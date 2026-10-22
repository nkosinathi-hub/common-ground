import { describe, expect, it } from "vitest"
import {
  DETAILS_TTL_MS,
  SEARCH_TTL_MS,
  detailsKey,
  expiryFor,
  isFresh,
  searchKey,
} from "./cache.ts"

const now = new Date("2026-10-15T10:00:00.000Z")

describe("cache keys", () => {
  it("normalises search queries so equivalent searches share an entry", () => {
    expect(searchKey("  Spirited   Away ", 2)).toBe("search:spirited away:2")
    expect(searchKey("SPIRITED AWAY", 2)).toBe(searchKey("spirited away", 2))
    expect(searchKey("dune", 1)).not.toBe(searchKey("dune", 2))
  })

  it("keys details by type and id", () => {
    // v2 since v0.5 added trailers, recommendations, seasons and IMDb ids: older rows lack them.
    expect(detailsKey("movie", 438631)).toBe("details:v2:movie:438631")
    expect(detailsKey("tv", 438631)).not.toBe(detailsKey("movie", 438631))
  })
})

describe("TTL", () => {
  it("keeps searches 15 minutes and details with providers 24 hours", () => {
    expect(SEARCH_TTL_MS).toBe(15 * 60 * 1000)
    expect(DETAILS_TTL_MS).toBe(24 * 60 * 60 * 1000)
    expect(expiryFor("search", now).toISOString()).toBe("2026-10-15T10:15:00.000Z")
    expect(expiryFor("details", now).toISOString()).toBe("2026-10-16T10:00:00.000Z")
  })

  it("treats an entry as fresh only before it expires", () => {
    expect(isFresh({ expiresAt: "2026-10-15T10:00:01.000Z" }, now)).toBe(true)
    expect(isFresh({ expiresAt: "2026-10-15T10:00:00.000Z" }, now)).toBe(false)
    expect(isFresh({ expiresAt: "garbage" }, now)).toBe(false)
  })
})
