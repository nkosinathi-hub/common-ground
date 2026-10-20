// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { config } from "../../testing/fake-plugin"
import { json, startFixtureServer, type FixtureServer } from "../../testing/fixture-server"
import { resolverHarness } from "../../testing/resolver-harness"
import { fixturePlugin } from "./plugin"

let server: FixtureServer
let healthy = false
const movie = { kind: "movie", tmdbId: 1 } as const
const media = [{ path: "/media/hls/index.m3u8" }]

beforeAll(async () => {
  server = await startFixtureServer({
    "/backup": (_req, res) => json(res, { sources: [{ path: "/media/sample.mp4" }] }),
    "/sick": (_req, res) => json(res, {}, healthy ? 200 : 503),
    "/recovering": (_req, res) => (healthy ? json(res, { sources: media }) : json(res, {}, 500)),
  })
})
afterAll(() => server.close())

describe("the circuit breaker over a real HTTP fixture server", () => {
  it("opens after repeated failures, skips the provider, and recovers through its probe", async () => {
    const harness = resolverHarness({
      plugins: [fixturePlugin(server.origin), fixturePlugin(server.origin, "backup")],
      configs: [
        config("fixture", { options: { catalog: "/recovering", health: "/sick" } }),
        config("backup", { priority: 2, options: { catalog: "/backup" } }),
      ],
    })
    const count = (path: string) => server.hits.filter((h) => h.path === path).length
    await harness.resolver.resolve(movie)
    await harness.resolver.resolve(movie)
    expect(harness.health.state("fixture")).toBe("open")
    const before = count("/recovering")
    expect(await harness.resolver.resolve(movie)).toMatchObject({
      value: { best: { providerId: "backup" } },
    })
    expect(count("/recovering")).toBe(before)
    harness.advance(30_000)
    await harness.resolver.resolve(movie)
    expect(harness.health.state("fixture")).toBe("open")
    healthy = true
    harness.advance(30_000)
    const recovered = await harness.resolver.resolve(movie)
    expect(recovered).toMatchObject({ value: { best: { providerId: "fixture" } } })
    expect(count("/sick")).toBe(2)
    expect(harness.health.state("fixture")).toBe("closed")
  })
})
