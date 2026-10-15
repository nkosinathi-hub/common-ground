import { describe, expect, it } from "vitest"
import { bearerToken, corsHeaders, jsonResponse, parseOrigins } from "./http.ts"

const allowed = parseOrigins(" http://127.0.0.1:5173 ,http://localhost:5173,, ")

describe("parseOrigins", () => {
  it("splits, trims and drops empties", () => {
    expect(allowed).toEqual(["http://127.0.0.1:5173", "http://localhost:5173"])
    expect(parseOrigins(undefined)).toEqual([])
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

describe("jsonResponse", () => {
  it("returns private, uncached JSON", async () => {
    const response = jsonResponse(
      429,
      { error: { kind: "rate_limited", message: "x" } },
      { Vary: "Origin" },
    )
    expect(response.status).toBe(429)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(response.headers.get("content-type")).toBe("application/json")
    expect(response.headers.get("vary")).toBe("Origin")
    expect(await response.json()).toEqual({ error: { kind: "rate_limited", message: "x" } })
  })
})

describe("bearerToken", () => {
  it("extracts the token from an Authorization header", () => {
    expect(bearerToken("Bearer abc.def")).toBe("abc.def")
    expect(bearerToken("bearer abc")).toBe("abc")
    expect(bearerToken("Basic abc")).toBeNull()
    expect(bearerToken(null)).toBeNull()
  })
})
