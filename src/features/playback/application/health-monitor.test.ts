import { describe, expect, it, vi } from "vitest"
import { appError, err, ok } from "../../../shared/domain/result"
import { config, fakeDeps, fakePlugin } from "../testing/fake-plugin"
import { HealthMonitor } from "./health-monitor"
import { PluginRegistry } from "./plugin-registry"

function entry(probe: boolean, healthy: () => boolean) {
  const registry = new PluginRegistry()
  const health = vi.fn(async () => (healthy() ? ok(undefined) : err(appError("network", "down"))))
  registry.register(fakePlugin("alpha", { probe, health }))
  const built = registry.fromConfig([config("alpha")], fakeDeps()).providers[0]
  if (!built) throw new Error("fixture")
  return { built, health }
}

function setup(probe = true) {
  let now = 0
  let healthy = false
  const monitor = new HealthMonitor({ threshold: 2, cooldownMs: 1_000 }, () => now)
  const { built, health } = entry(probe, () => healthy)
  const signal = new AbortController().signal
  const tripped = () => {
    monitor.failure("alpha")
    monitor.failure("alpha")
  }
  return {
    ...{ monitor, built, health, signal, tripped },
    advance: (ms: number) => (now += ms),
    heal: () => (healthy = true),
  }
}

describe("HealthMonitor", () => {
  it("admits a closed provider without probing", async () => {
    const { monitor, built, health, signal } = setup()
    expect(await monitor.admit(built, signal)).toBe(true)
    expect(health).not.toHaveBeenCalled()
  })

  it("skips an open provider for the cooldown", async () => {
    const { monitor, built, signal, tripped } = setup()
    tripped()
    expect(monitor.state("alpha")).toBe("open")
    expect(await monitor.admit(built, signal)).toBe(false)
  })

  it("probes in half-open: a failed probe re-opens, a passing one closes", async () => {
    const { monitor, built, health, signal, tripped, advance, heal } = setup()
    tripped()
    advance(1_000)
    expect(await monitor.admit(built, signal)).toBe(false)
    expect(monitor.state("alpha")).toBe("open")
    advance(1_000)
    heal()
    expect(await monitor.admit(built, signal)).toBe(true)
    expect(monitor.state("alpha")).toBe("closed")
    expect(health).toHaveBeenCalledTimes(2)
  })

  it("treats a throwing probe as a failure", async () => {
    const { monitor, built, signal, tripped, advance } = setup()
    const thrower = {
      ...built,
      provider: { ...built.provider, health: () => Promise.reject(new Error("x")) },
    }
    tripped()
    advance(1_000)
    expect(await monitor.admit(thrower, signal)).toBe(false)
  })

  it("lets one trial through in half-open when the plugin has no probe", async () => {
    const { monitor, built, health, signal, tripped, advance } = setup(false)
    tripped()
    advance(1_000)
    expect(await monitor.admit(built, signal)).toBe(true)
    expect(health).not.toHaveBeenCalled()
    monitor.success("alpha")
    expect(monitor.state("alpha")).toBe("closed")
  })
})
