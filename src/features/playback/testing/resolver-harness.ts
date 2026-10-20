import { HealthMonitor } from "../application/health-monitor"
import { PluginRegistry } from "../application/plugin-registry"
import { SourceResolver } from "../application/source-resolver"
import type { ProviderPlugin } from "../domain/plugin.types"
import type { ProviderConfig } from "../domain/provider.types"
import type { PlayableSource } from "../domain/source.types"
import { fakeDeps, RecordingLog } from "./fake-plugin"

export interface HarnessOptions {
  readonly plugins: readonly ProviderPlugin[]
  readonly configs: readonly ProviderConfig[]
  readonly canPlay?: (source: PlayableSource) => boolean
  readonly threshold?: number
}

/** A real registry, health monitor and resolver over loopback plugins, with a movable clock. */
export function resolverHarness(options: HarnessOptions) {
  let now = 0
  const clock = () => now
  const registry = new PluginRegistry({ allowLoopback: true })
  const registered = options.plugins.map((p) => registry.register(p))
  const log = new RecordingLog()
  const built = registry.fromConfig(options.configs, { ...fakeDeps(), log, clock })
  const health = new HealthMonitor({ threshold: options.threshold ?? 2, cooldownMs: 30_000 }, clock)
  const resolver = new SourceResolver(built.providers, {
    ...{ health, log, clock, backoffMs: 5 },
    canPlay: options.canPlay ?? (() => true),
  })
  return {
    ...{ registry, registered, built, health, resolver, log },
    advance: (ms: number) => (now += ms),
  }
}
