import { readFileSync } from "node:fs"
import { dirname, join, normalize } from "node:path"
import { describe, expect, it } from "vitest"
import { playbackPlugins } from "../../src/app/composition/playback"
import { cspOrigins } from "../../src/features/playback/domain/csp-origins"
import { EMPTY_POLICY } from "../../src/features/playback/domain/policy"

const ENTRY = "src/app/composition/playback.ts"
const UNLICENSED = /vidsrc|embed\.su|autoembed|multiembed|consumet|2embed|superembed/i

const plugin = (media: string[]) => ({ type: "rogue", security: { ...EMPTY_POLICY, media } })

describe("the playback plugins compiled into the build", () => {
  const plugins = playbackPlugins({ jellyfinOrigin: "https://jf.example.org" })

  it("declare only valid https origins, so the build's CSP can be built", () => {
    const origins = cspOrigins(plugins)
    for (const origin of [...origins.connect, ...origins.media, ...origins.frames])
      expect(origin).toMatch(/^https:\/\/(\*\.)?[a-z0-9.-]+$/)
    expect(origins.frames).toEqual([
      "https://archive.org",
      "https://video.blender.org",
      "https://www.youtube-nocookie.com",
    ])
  })

  it("include Jellyfin only when the build names its origin", () => {
    expect(plugins.map((p) => p.type)).toEqual([
      "jellyfin",
      "internet-archive",
      "peertube",
      "youtube-trailer",
    ])
    expect(playbackPlugins({}).map((p) => p.type)).not.toContain("jellyfin")
    expect(() => playbackPlugins({ jellyfinOrigin: "http://jf.example.org" })).toThrow(/https/)
    const loopback = playbackPlugins({ jellyfinOrigin: "http://127.0.0.1:8096" })
    expect(() => cspOrigins(loopback)).toThrow(/jellyfin.*https/)
  })

  it("never name an unlicensed aggregator", () => {
    expect(readFileSync(ENTRY, "utf8")).not.toMatch(UNLICENSED)
    expect(JSON.stringify(plugins.map((p) => [p.type, p.security]))).not.toMatch(UNLICENSED)
  })
})

describe("the build refuses a plugin that declares", () => {
  it.each([
    ["*"],
    ["http://cdn.example.org"],
    ["javascript:alert(1)"],
    ["data:"],
    ["'unsafe-inline'"],
  ])("%s", (origin) => expect(() => cspOrigins([plugin([origin])])).toThrow(/rogue/))
})

/** vite.config.ts loads the plugin list before Vite's aliases exist, so only relative imports. */
function runtimeImports(path: string, seen = new Set<string>()): string[] {
  if (seen.has(path)) return []
  seen.add(path)
  const text = readFileSync(path, "utf8")
  const found = [...text.matchAll(/^import (?!type )[^"']*from "([^"]+)"/gm)].map((m) => m[1] ?? "")
  return found.flatMap((spec) => {
    if (!spec.startsWith(".")) return [spec]
    const next = normalize(join(dirname(path), spec)) + ".ts"
    return runtimeImports(next, seen)
  })
}

describe("the plugin list's import graph", () => {
  it("uses no alias and no Svelte, so vite.config.ts can read it", () => {
    const packages = runtimeImports(ENTRY)
    expect(packages.filter((spec) => /^(@\/|\$lib|svelte)/.test(spec))).toEqual([])
  })
})
