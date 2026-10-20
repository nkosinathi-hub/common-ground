import { describe, expect, it, vi } from "vitest"
import { appError, err, ok } from "../../../shared/domain/result"
import type { MediaRef } from "../domain/media-ref"
import type { ProviderConfig } from "../domain/provider.types"
import {
  config,
  fakeDeps,
  fakePlugin,
  fakeSource,
  type FakeBehaviour,
} from "../testing/fake-plugin"
import { HealthMonitor } from "./health-monitor"
import { PluginRegistry } from "./plugin-registry"
import { SourceResolver } from "./source-resolver"

const movie: MediaRef = { kind: "movie", tmdbId: 1 }

function setup(plugins: Record<string, FakeBehaviour>, configs: ProviderConfig[]) {
  const registry = new PluginRegistry()
  for (const [type, b] of Object.entries(plugins)) registry.register(fakePlugin(type, b))
  const deps = fakeDeps()
  const { providers } = registry.fromConfig(configs, deps)
  const health = new HealthMonitor({ threshold: 1, cooldownMs: 60_000 }, () => 0)
  const sleep = vi.fn(async () => {})
  const resolver = new SourceResolver(providers, {
    ...{ health, log: deps.log, clock: () => 0, sleep, backoffMs: 10 },
    canPlay: () => true,
  })
  return { resolver, sleep, health, log: deps.log as unknown as { entries: unknown[] } }
}

describe("SourceResolver", () => {
  it("asks every provider in parallel and ranks by priority then quality", async () => {
    const { resolver } = setup(
      {
        a: { resolve: async () => ok([fakeSource("a", "a", 480)]) },
        b: { resolve: async () => ok([fakeSource("b", "b", 1080), fakeSource("b", "b", 2160)]) },
      },
      [config("a", { priority: 2 }), config("b", { priority: 1 })],
    )
    const result = await resolver.resolve(movie)
    if (!result.ok) throw new Error(result.error.message)
    expect(result.value.best.quality).toBe(2160)
    expect(result.value.fallbacks.map((s) => s.quality)).toEqual([1080, 480])
  })

  it("retries transient errors with growing backoff, never permanent ones", async () => {
    let calls = 0
    const flaky = async () =>
      ++calls < 3 ? err(appError("network", "x")) : ok([fakeSource("a", "a")])
    const gone = vi.fn(async () => err(appError("not_found", "no")))
    const { resolver, sleep } = setup({ a: { resolve: flaky }, b: { resolve: gone } }, [
      config("a", { retries: 2 }),
      config("b", { retries: 2 }),
    ])
    expect((await resolver.resolve(movie)).ok).toBe(true)
    expect(calls).toBe(3)
    expect(sleep.mock.calls.map((c) => c[0] as number)).toEqual([10, 20])
    expect(gone).toHaveBeenCalledTimes(1)
  })

  it("rejects and logs a source outside its own provider's policy, and a foreign providerId", async () => {
    const stray = { ...fakeSource("a", "a"), url: "https://b.example.org/x.m3u8" }
    const forged = fakeSource("a", "b")
    const { resolver, log } = setup({ a: { resolve: async () => ok([stray, forged]) }, b: {} }, [
      config("a"),
      config("b"),
    ])
    const result = await resolver.resolve(movie)
    expect(result).toMatchObject({ ok: true, value: { best: { providerId: "b" }, fallbacks: [] } })
    expect(log.entries).toContainEqual(
      expect.objectContaining({ providerId: "a", outcome: "rejected" }),
    )
  })

  it("fails only when nothing at all can play, and opens the failing provider's circuit", async () => {
    const down = async () => err(appError("network", "down"))
    const { resolver, health } = setup({ a: { resolve: down } }, [config("a")])
    expect(await resolver.resolve(movie)).toMatchObject({ ok: false, error: { kind: "not_found" } })
    expect(health.state("a")).toBe("open")
    expect(resolver.providerFor(fakeSource("a", "a"))).toBeDefined()
    expect(resolver.providerFor(fakeSource("a", "zz"))).toBeUndefined()
  })

  it("does not open the circuit for a title the provider simply lacks", async () => {
    const lacks = async () => err(appError("not_found", "no"))
    const { resolver, health } = setup({ a: { resolve: lacks } }, [config("a")])
    await resolver.resolve(movie)
    expect(health.state("a")).toBe("closed")
  })
})
