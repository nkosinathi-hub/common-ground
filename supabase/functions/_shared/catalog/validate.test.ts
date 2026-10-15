import { describe, expect, it } from "vitest"
import { parseRequest } from "./validate.ts"

const spaceId = "0b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f60"

describe("parseRequest", () => {
  it("accepts a search and trims the query", () => {
    expect(parseRequest({ action: "search", spaceId, q: "  dune ", page: 2 })).toEqual({
      ok: true,
      value: { action: "search", spaceId, query: "dune", page: 2 },
    })
    expect(parseRequest({ action: "search", spaceId, q: "dune" })).toMatchObject({
      value: { page: 1 },
    })
  })

  it("rejects queries outside 2-160 characters and pages outside 1-20", () => {
    for (const bad of [
      { q: "a" },
      { q: "   a  " },
      { q: "x".repeat(161) },
      { q: 12 },
      { q: "dune", page: 0 },
      { q: "dune", page: 21 },
      { q: "dune", page: 1.5 },
      { q: "dune", page: "2" },
    ]) {
      expect(parseRequest({ action: "search", spaceId, ...bad }).ok).toBe(false)
    }
    expect(parseRequest({ action: "search", spaceId, q: "x".repeat(160) }).ok).toBe(true)
  })

  it("accepts details and refresh with a numeric id as number or digits", () => {
    expect(parseRequest({ action: "details", spaceId, type: "tv", id: "1429" })).toEqual({
      ok: true,
      value: { action: "details", spaceId, type: "tv", id: 1429 },
    })
    expect(parseRequest({ action: "refresh", spaceId, type: "movie", id: 7 })).toMatchObject({
      ok: true,
    })
  })

  it("rejects bad types, ids, spaces and actions", () => {
    for (const bad of [
      { action: "details", spaceId, type: "person", id: 1 },
      { action: "details", spaceId, type: "movie", id: "1e3" },
      { action: "details", spaceId, type: "movie", id: -1 },
      { action: "details", spaceId, type: "movie", id: 2147483648 },
      { action: "details", spaceId: "not-a-uuid", type: "movie", id: 1 },
      { action: "delete", spaceId },
      null,
      "search",
    ]) {
      expect(parseRequest(bad).ok).toBe(false)
    }
  })
})
