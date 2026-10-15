import { describe, expect, it } from "vitest"
import { corsHeaders, isOriginAllowed, parseOrigins } from "./cors.ts"

const allowed = parseOrigins(" http://127.0.0.1:5173 ,http://localhost:5173,, ")

describe("parseOrigins", () => {
  it("splits, trims and drops empties", () => {
    expect(allowed).toEqual(["http://127.0.0.1:5173", "http://localhost:5173"])
    expect(parseOrigins(undefined)).toEqual([])
  })
})

describe("isOriginAllowed", () => {
  it("allows only listed origins, never a missing origin or a wildcard", () => {
    expect(isOriginAllowed("http://localhost:5173", allowed)).toBe(true)
    expect(isOriginAllowed("https://evil.example", allowed)).toBe(false)
    expect(isOriginAllowed(null, allowed)).toBe(false)
    expect(isOriginAllowed("*", ["*"])).toBe(false)
  })
})

describe("corsHeaders", () => {
  it("echoes only an allowed origin", () => {
    const headers = corsHeaders("http://localhost:5173", allowed)
    expect(headers["Access-Control-Allow-Origin"]).toBe("http://localhost:5173")
    expect(headers.Vary).toBe("Origin")
    expect(headers["Access-Control-Allow-Headers"]).toMatch(/authorization/)
    expect(headers["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS")
  })

  it("never allows a wildcard or an unknown origin", () => {
    expect(
      corsHeaders("https://evil.example", allowed)["Access-Control-Allow-Origin"],
    ).toBeUndefined()
    expect(corsHeaders(null, ["*"])["Access-Control-Allow-Origin"]).toBeUndefined()
  })
})
