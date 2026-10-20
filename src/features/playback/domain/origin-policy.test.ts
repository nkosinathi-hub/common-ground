import { describe, expect, it } from "vitest"
import { checkPattern, matchesAny, matchesOrigin } from "./origin-policy"

describe("checkPattern", () => {
  it.each([
    "https://archive.org",
    "https://jelly.example.org:8920",
    "https://*.us.archive.org",
    "https://*.example.org",
  ])("accepts %s", (pattern) => {
    expect(checkPattern(pattern)).toBeNull()
  })

  it.each([
    ["*", /wildcard/],
    ["https://*", /wildcard/],
    ["https://*.org", /wildcard/],
    ["https://a.*.example.org", /wildcard/],
    ["https://**.example.org", /wildcard/],
    ["http://example.org", /https/],
    ["ws://example.org", /https/],
    ["javascript:alert(1)", /script/],
    ["data:", /script/],
    ["blob:", /script/],
    ["filesystem:", /script/],
    ["'unsafe-inline'", /keyword/],
    ["'self'", /keyword/],
    ["https://example.org/path", /origin/],
    ["https://user@example.org", /origin/],
    ["https://example.org?x=1", /origin/],
    ["", /origin/],
  ])("refuses %s", (pattern, reason) => {
    expect(checkPattern(pattern)).toMatch(reason)
  })

  it("accepts loopback http only when the rules allow it (tests)", () => {
    expect(checkPattern("http://127.0.0.1:4100")).toMatch(/https/)
    expect(checkPattern("http://127.0.0.1:4100", { allowLoopback: true })).toBeNull()
    expect(checkPattern("http://localhost:4100", { allowLoopback: true })).toBeNull()
    expect(checkPattern("http://example.org", { allowLoopback: true })).toMatch(/https/)
  })
})

describe("matchesOrigin", () => {
  it("matches an exact origin, with its port", () => {
    expect(matchesOrigin("https://archive.org/download/x.mp4", "https://archive.org")).toBe(true)
    expect(matchesOrigin("https://archive.org:444/x", "https://archive.org")).toBe(false)
    expect(matchesOrigin("http://archive.org/x", "https://archive.org")).toBe(false)
    expect(matchesOrigin("https://evil-archive.org/x", "https://archive.org")).toBe(false)
  })

  it("matches exactly one subdomain level for a wildcard", () => {
    const pattern = "https://*.us.archive.org"
    expect(matchesOrigin("https://ia800.us.archive.org/1/x.mp4", pattern)).toBe(true)
    expect(matchesOrigin("https://us.archive.org/x", pattern)).toBe(false)
    expect(matchesOrigin("https://a.ia800.us.archive.org/x", pattern)).toBe(false)
    expect(matchesOrigin("https://ia800.us.archive.org.evil.com/x", pattern)).toBe(false)
  })

  it("never matches junk or script URLs", () => {
    expect(matchesOrigin("not a url", "https://archive.org")).toBe(false)
    expect(matchesOrigin("javascript:alert(1)", "https://archive.org")).toBe(false)
    expect(matchesAny("https://archive.org/x", ["https://a.org", "https://archive.org"])).toBe(true)
    expect(matchesAny("https://archive.org/x", [])).toBe(false)
  })
})
