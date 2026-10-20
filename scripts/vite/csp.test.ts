import { describe, expect, it } from "vitest"
import { contentSecurityPolicy, cspPlugin } from "./csp"

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

  it("lets Realtime run its heartbeat in a worker it builds from a blob, and nothing else", () => {
    expect(policy).toContain("worker-src 'self' blob:")
  })

  it("supports a local http stack", () => {
    expect(contentSecurityPolicy("http://127.0.0.1:54321")).toContain("ws://127.0.0.1:54321")
  })

  it("lets the Android app read the website's version.json, and nothing else of it", () => {
    const app = contentSecurityPolicy("https://abc.supabase.co", "https://site.example/cg/")
    expect(app).toContain(
      "connect-src 'self' https://abc.supabase.co wss://abc.supabase.co https://site.example/cg/app/version.json",
    )
  })

  it("rejects a missing or invalid Supabase URL", () => {
    expect(() => contentSecurityPolicy("")).toThrow(/VITE_SUPABASE_URL/)
  })

  it("injects a meta tag into the page head", () => {
    const html = cspPlugin("https://abc.supabase.co").transformIndexHtml("<head></head>")
    expect(html).toMatch(/<head><meta http-equiv="Content-Security-Policy" content="default-src/)
  })

  it("sends only the origin as the referrer, never a path", () => {
    const html = cspPlugin("https://abc.supabase.co").transformIndexHtml("<head></head>")
    expect(html).toContain('<meta name="referrer" content="strict-origin" />')
  })
})

describe("contentSecurityPolicy with playback origins", () => {
  const playback = {
    connect: ["https://jf.example.org", "https://query.wikidata.org"],
    media: ["https://jf.example.org", "https://*.us.archive.org"],
    frames: ["https://www.youtube-nocookie.com"],
  }
  const policy = contentSecurityPolicy("https://abc.supabase.co", "", playback)

  it("adds the plugins' origins to connect-src, media-src (with blob: for MSE) and frame-src", () => {
    expect(policy).toContain(
      "connect-src 'self' https://abc.supabase.co wss://abc.supabase.co https://jf.example.org https://query.wikidata.org",
    )
    expect(policy).toContain(
      "media-src 'self' blob: https://jf.example.org https://*.us.archive.org",
    )
    expect(policy).toContain("frame-src https://www.youtube-nocookie.com")
  })

  it("never widens script-src or the rest of the app", () => {
    expect(policy).toContain("script-src 'self';")
    expect(policy).toContain("default-src 'self';")
    expect(policy).not.toMatch(/script-src[^;]*(youtube|jf\.example|archive)/)
  })

  it("frames nothing and plays only own and blob media without playback plugins", () => {
    const bare = contentSecurityPolicy("https://abc.supabase.co")
    expect(bare).toContain("media-src 'self' blob:;")
    expect(bare).toContain("frame-src 'none'")
  })
})

describe("cspPlugin", () => {
  it("fails at creation, not at page transform", () => {
    expect(() => cspPlugin("https://abc.supabase.co/rest/v1/")).toThrow(
      /must be the project origin/,
    )
  })
})
