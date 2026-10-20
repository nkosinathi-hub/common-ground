// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { EMPTY_POLICY } from "../../domain/policy"
import { json, startFixtureServer, type FixtureServer } from "../../testing/fixture-server"
import { mirrorPlugin, storedConfigs as stored } from "../../testing/mirror-plugin"
import { resolverHarness } from "../../testing/resolver-harness"
import { fixturePlugin } from "./plugin"

let server: FixtureServer
beforeAll(async () => {
  server = await startFixtureServer({
    "/stray": (_req, res) => json(res, { sources: [{ url: "https://evil.example.org/a.m3u8" }] }),
    "/hls-only": (_req, res) => json(res, { sources: [{ path: "/media/hls/index.m3u8" }] }),
  })
})
afterAll(() => server.close())
const movie = { kind: "movie", tmdbId: 7 } as const

describe("a new plugin registered at runtime, with no core change", () => {
  it.each([
    ["times out", "/slow"],
    ["answers 500", "/fail"],
    ["returns a URL outside its policy", "/stray"],
  ])(
    "is discovered from config, invoked and used as the fallback when the first %s",
    async (_why, catalog) => {
      const harness = resolverHarness({
        plugins: [fixturePlugin(server.origin), mirrorPlugin(server.origin)],
        configs: stored(catalog),
      })
      expect(harness.registry.types()).toEqual(["fixture", "community-mirror"])
      expect(harness.built.providers.map((p) => p.provider.id)).toEqual(["fixture", "mirror"])
      const result = await harness.resolver.resolve(movie)
      expect(result).toMatchObject({
        ok: true,
        value: { best: { providerId: "mirror", kind: "dash" } },
      })
      const body = await (await fetch(result.ok ? result.value.best.url : "")).text()
      expect(body).toContain("<MPD")
    },
  )

  it("is ranked by device capability above a higher-priority source the device cannot play", async () => {
    const harness = resolverHarness({
      plugins: [fixturePlugin(server.origin), mirrorPlugin(server.origin)],
      configs: stored("/hls-only"),
      canPlay: (s) => s.kind === "dash",
    })
    const result = await harness.resolver.resolve(movie)
    expect(result).toMatchObject({ value: { best: { providerId: "mirror" } } })
  })

  it("is refused at registration when its policy is invalid", () => {
    const evil = { ...mirrorPlugin(server.origin), security: { ...EMPTY_POLICY, media: ["*"] } }
    const harness = resolverHarness({ plugins: [evil], configs: stored("/fail") })
    expect(harness.registered[0]).toMatchObject({ ok: false, error: { field: "media" } })
    expect(harness.built.refused.map((r) => r.reason)).toContain(
      "no plugin of type community-mirror",
    )
  })
})
