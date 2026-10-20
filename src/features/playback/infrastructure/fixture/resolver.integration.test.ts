// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { fixturePlugin } from "./plugin"
import { config } from "../../testing/fake-plugin"
import { json, startFixtureServer, type FixtureServer } from "../../testing/fixture-server"
import { resolverHarness } from "../../testing/resolver-harness"

let server: FixtureServer
let flaky = 0
const movie = { kind: "movie", tmdbId: 1 } as const

beforeAll(async () => {
  const media = [
    { path: "/media/sample.mp4", quality: 360 },
    { path: "/media/hls/index.m3u8", quality: 720 },
    { path: "/media/dash/manifest.mpd", quality: 1080 },
  ]
  server = await startFixtureServer({
    "/catalog": (_req, res) => json(res, { sources: media }),
    "/backup": (_req, res) => json(res, { sources: [{ path: "/media/sample.mp4" }] }),
    "/flaky": (_req, res) => (++flaky < 3 ? json(res, {}, 500) : json(res, { sources: media })),
    "/stray": (_req, res) =>
      json(res, { sources: [{ url: "https://evil.example.org/x.m3u8", path: "" }] }),
  })
})
afterAll(() => server.close())

const plugins = () => [fixturePlugin(server.origin), fixturePlugin(server.origin, "backup")]
const primary = (catalog: string, extra = {}) =>
  config("fixture", { options: { catalog }, timeoutMs: 300, ...extra })
const backup = config("backup", { priority: 2, options: { catalog: "/backup" } })

describe("SourceResolver over a real HTTP fixture server", () => {
  it("resolves HLS, DASH and MP4 that the server really serves, best quality first", async () => {
    const { resolver } = resolverHarness({ plugins: plugins(), configs: [primary("/catalog")] })
    const result = await resolver.resolve(movie)
    if (!result.ok) throw new Error(result.error.message)
    const all = [result.value.best, ...result.value.fallbacks]
    expect(all.map((s) => s.kind)).toEqual(["dash", "hls", "file"])
    const bodies = await Promise.all(all.map(async (s) => (await fetch(s.url)).text()))
    expect(bodies[0]).toContain("<MPD")
    expect(bodies[1]).toContain("#EXTM3U")
    expect(bodies[2]?.slice(4, 8)).toBe("ftyp")
  })

  it("falls back to the next provider when the first times out", async () => {
    const { resolver, log } = resolverHarness({
      plugins: plugins(),
      configs: [primary("/slow"), backup],
    })
    const result = await resolver.resolve(movie)
    expect(result).toMatchObject({ ok: true, value: { best: { providerId: "backup" } } })
    expect(log.entries).toContainEqual(
      expect.objectContaining({ providerId: "fixture", outcome: "timeout" }),
    )
  })

  it("falls back when the first answers 500, and retries a flaky one until it answers", async () => {
    const failing = resolverHarness({ plugins: plugins(), configs: [primary("/fail"), backup] })
    expect(await failing.resolver.resolve(movie)).toMatchObject({
      value: { best: { providerId: "backup" } },
    })
    const retrying = resolverHarness({
      plugins: plugins(),
      configs: [primary("/flaky", { retries: 2 })],
    })
    expect(await retrying.resolver.resolve(movie)).toMatchObject({
      value: { best: { kind: "dash" } },
    })
    expect(server.hits.filter((h) => h.path === "/flaky")).toHaveLength(3)
  })

  it("rejects and logs a source outside the provider's policy, then uses the fallback", async () => {
    const { resolver, log } = resolverHarness({
      plugins: plugins(),
      configs: [primary("/stray"), backup],
    })
    expect(await resolver.resolve(movie)).toMatchObject({
      value: { best: { providerId: "backup" }, fallbacks: [] },
    })
    expect(log.entries).toContainEqual(
      expect.objectContaining({ providerId: "fixture", outcome: "rejected" }),
    )
  })
})
