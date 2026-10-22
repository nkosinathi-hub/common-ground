import { describe, expect, it } from "vitest"
import { manifestFor } from "./manifest"

const manifest = manifestFor("https://abc.supabase.co", "0.5.1")

describe("the extension manifest", () => {
  it("is Manifest V3 and asks only for storage", () => {
    expect(manifest.manifest_version).toBe(3)
    expect(manifest.permissions).toEqual(["storage"])
  })

  it("reaches only netflix.com and the build's Supabase origin", () => {
    expect(manifest.host_permissions).toEqual([
      "https://www.netflix.com/*",
      "https://abc.supabase.co/*",
    ])
    expect(JSON.stringify(manifest)).not.toMatch(/all_urls|"tabs"|history|webRequest|\*:\/\//)
  })

  it("runs the content script and the MAIN-world seek script on netflix.com only", () => {
    const scripts = manifest.content_scripts
    expect(scripts.map((s) => [s.js, s.world ?? "ISOLATED"])).toEqual([
      [["content.js"], "ISOLATED"],
      [["page.js"], "MAIN"],
    ])
    for (const s of scripts) expect(s.matches).toEqual(["https://www.netflix.com/*"])
  })

  it("keeps the MV3 default CSP: its own scripts only, no remote code", () => {
    expect(manifest.content_security_policy.extension_pages).toBe(
      "script-src 'self'; object-src 'self'",
    )
  })

  it("refuses a Supabase URL that is not a bare origin", () => {
    expect(() => manifestFor("https://abc.supabase.co/rest/v1", "1.0.0")).toThrow(/origin/)
    expect(() => manifestFor("", "1.0.0")).toThrow()
  })
})
