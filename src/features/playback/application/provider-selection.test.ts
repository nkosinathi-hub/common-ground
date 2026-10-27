import { describe, expect, it } from "vitest"
import { ok } from "../../../shared/domain/result"
import type { MediaRef } from "../domain/media-ref"
import { config, fakeDeps, fakePlugin, fakeSource } from "../testing/fake-plugin"
import { HealthMonitor } from "./health-monitor"
import { PluginRegistry } from "./plugin-registry"
import { SourceResolver } from "./source-resolver"

const movie: MediaRef = { kind: "movie", tmdbId: 603 }

describe("provider selection", () => {
  it("keeps trailers out of title playback and resolves them only on request", async () => {
    const registry = new PluginRegistry()
    registry.register(
      fakePlugin("cinepro", {
        resolve: async () => ok([fakeSource("cinepro", "cinepro")]),
      }),
    )
    registry.register(
      fakePlugin("trailer", {
        resolve: async () => ok([fakeSource("trailer", "trailer")]),
      }),
    )
    const deps = fakeDeps()
    const { providers } = registry.fromConfig([config("cinepro"), config("trailer")], deps)
    const resolver = new SourceResolver(providers, {
      health: new HealthMonitor({ threshold: 3, cooldownMs: 60_000 }, () => 0),
      log: deps.log,
      clock: () => 0,
      canPlay: () => true,
    })
    expect(await resolver.resolve(movie, { excludeProviderIds: ["trailer"] })).toMatchObject({
      value: { best: { providerId: "cinepro" }, fallbacks: [] },
    })
    expect(await resolver.resolve(movie, { providerIds: ["trailer"] })).toMatchObject({
      value: { best: { providerId: "trailer" }, fallbacks: [] },
    })
  })
})
