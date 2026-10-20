// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { PluginRegistry } from "../../application/plugin-registry"
import { config } from "../../testing/fake-plugin"
import { startFixtureServer, type FixtureServer } from "../../testing/fixture-server"
import { peertubeRoutes, PT_TITLES } from "../../testing/peertube-routes"
import { resolverHarness } from "../../testing/resolver-harness"
import { fixturePlugin } from "../fixture/plugin"
import { peertubePlugin } from "./plugin"

let server: FixtureServer
beforeAll(async () => {
  const routes = peertubeRoutes(() => server.origin)
  server = await startFixtureServer({
    ...routes,
    "/backup": (_req, res) => res.end(JSON.stringify({ sources: [{ path: "/media/sample.mp4" }] })),
  })
})
afterAll(() => server.close())

const movie = (tmdbId: number) => ({ kind: "movie", tmdbId }) as const

function harness(extra = {}) {
  return resolverHarness({
    plugins: [peertubePlugin({ origin: server.origin }), fixturePlugin(server.origin, "backup")],
    configs: [
      config("peertube", { options: { titles: PT_TITLES }, timeoutMs: 300, ...extra }),
      config("backup", { priority: 2, options: { catalog: "/backup" } }),
    ],
  })
}

describe("peertube through the real registry and resolver", () => {
  it("ranks its sources above a lower-priority provider's", async () => {
    const result = await harness().resolver.resolve(movie(10378))
    expect(result).toMatchObject({
      ok: true,
      value: { best: { kind: "hls", providerId: "peertube" } },
    })
    if (!result.ok) return
    expect(result.value.fallbacks.map((s) => s.providerId)).toEqual([
      "peertube",
      "peertube",
      "backup",
    ])
  })

  it("drops and logs a playlist outside its policy, and the next provider still plays", async () => {
    const { resolver, log } = harness()
    expect(await resolver.resolve(movie(4))).toMatchObject({
      value: { best: { providerId: "backup" }, fallbacks: [] },
    })
    expect(log.entries).toContainEqual(
      expect.objectContaining({ providerId: "peertube", outcome: "rejected" }),
    )
  })

  it("times out a silent instance and falls back", async () => {
    const { resolver, log } = harness()
    expect(await resolver.resolve(movie(6))).toMatchObject({
      value: { best: { providerId: "backup" } },
    })
    expect(log.entries).toContainEqual(
      expect.objectContaining({ providerId: "peertube", outcome: "timeout" }),
    )
  })

  it("retries a 500, then opens the circuit and stops asking", async () => {
    const h = harness({ retries: 1 })
    const asked = () => server.hits.filter((x) => x.path.endsWith("0006")).length
    const before = asked()
    await h.resolver.resolve(movie(5))
    expect(asked() - before).toBe(2)
    await h.resolver.resolve(movie(5))
    expect(h.health.state("peertube")).toBe("open")
    const skipped = asked()
    expect(await h.resolver.resolve(movie(5))).toMatchObject({
      value: { best: { providerId: "backup" } },
    })
    expect(asked()).toBe(skipped)
  })

  it("is refused at registration with an http instance outside tests", () => {
    const registry = new PluginRegistry()
    const result = registry.register(peertubePlugin({ origin: server.origin }))
    expect(result.ok ? null : result.error.message).toMatch(/https/)
    expect(() => peertubePlugin({ origin: "https://*.example.org" })).toThrow(/exact https/)
  })
})
