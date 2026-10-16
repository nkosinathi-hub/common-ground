import { describe, expect, it } from "vitest"
import { bareOrigin, contentSecurityPolicy, cspPlugin } from "./csp"

describe("contentSecurityPolicy", () => {
  const policy = contentSecurityPolicy("https://abc.supabase.co")

  it("allows only this origin, Supabase (https and wss) and TMDB images", () => {
    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co")
    expect(policy).toContain(
      "img-src 'self' data: blob: https://image.tmdb.org https://abc.supabase.co",
    )
    expect(policy).toContain("script-src 'self'")
    expect(policy).toContain("object-src 'none'")
    expect(policy).not.toContain("unsafe-eval")
  })

  it("supports a local http stack", () => {
    expect(contentSecurityPolicy("http://127.0.0.1:54321")).toContain("ws://127.0.0.1:54321")
  })

  it("rejects a missing or invalid Supabase URL", () => {
    expect(() => contentSecurityPolicy("")).toThrow(/VITE_SUPABASE_URL/)
  })

  it("injects a meta tag into the page head", () => {
    const html = cspPlugin("https://abc.supabase.co").transformIndexHtml("<head></head>")
    expect(html).toMatch(/<head><meta http-equiv="Content-Security-Policy" content="default-src/)
  })
})

describe("bareOrigin", () => {
  const message =
    /VITE_SUPABASE_URL must be the project origin.*without a path such as \/rest\/v1\//

  it.each([
    "https://abc.supabase.co/rest/v1/",
    "https://abc.supabase.co/rest/v1",
    "https://abc.supabase.co/?x=1",
    "https://abc.supabase.co/#top",
    "ftp://abc.supabase.co",
  ])("rejects %s", (url) => {
    expect(() => bareOrigin(url)).toThrow(message)
  })

  it.each(["https://abc.supabase.co", "https://abc.supabase.co/", "http://127.0.0.1:54321"])(
    "accepts %s",
    (url) => {
      expect(bareOrigin(url).origin).toBe(url.replace(/\/$/, ""))
    },
  )

  it("makes the plugin fail at creation, not at page transform", () => {
    expect(() => cspPlugin("https://abc.supabase.co/rest/v1/")).toThrow(message)
  })
})
