import { appError, err, ok, type Result } from "../../../shared/domain/result"
import type { PolicyRules } from "../domain/origin-policy"
import type { PluginDeps, ProviderPlugin, SecurityPolicy } from "../domain/plugin.types"
import { validatePolicy } from "../domain/policy"
import type { Provider, ProviderConfig } from "../domain/provider.types"

/** A built provider with the config and plugin it came from. */
export interface RegisteredProvider {
  readonly config: ProviderConfig
  readonly plugin: ProviderPlugin
  readonly provider: Provider
  readonly policy: SecurityPolicy
}

export interface Refusal {
  readonly id: string
  readonly reason: string
}

export type SharedDeps = Omit<PluginDeps, "id">

function checkNumbers(config: ProviderConfig): string | null {
  if (!Number.isFinite(config.priority)) return "priority must be a number"
  const { timeoutMs, retries } = config
  if (!(Number.isFinite(timeoutMs) && timeoutMs >= 1 && timeoutMs <= 60_000))
    return "timeoutMs must be between 1 and 60000"
  if (!(Number.isInteger(retries) && retries >= 0 && retries <= 5))
    return "retries must be a whole number from 0 to 5"
  return null
}

/** Plugins by type. The core never names a type: config decides which providers exist. */
export class PluginRegistry {
  private readonly plugins = new Map<string, ProviderPlugin>()

  constructor(private readonly rules: PolicyRules = {}) {}

  register(plugin: ProviderPlugin): Result<void> {
    if (!plugin.type) return err(appError("validation", "A plugin needs a type", "type"))
    if (this.plugins.has(plugin.type))
      return err(appError("conflict", `A plugin of type ${plugin.type} is already registered`))
    const policy = validatePolicy(plugin.security, this.rules)
    if (!policy.ok) return policy
    this.plugins.set(plugin.type, plugin)
    return ok(undefined)
  }

  types(): string[] {
    return [...this.plugins.keys()]
  }

  /** Builds every enabled, valid config; the rest are refused with a reason, never thrown. */
  fromConfig(configs: readonly ProviderConfig[], deps: SharedDeps) {
    const providers: RegisteredProvider[] = []
    const refused: Refusal[] = []
    const ids = new Set<string>()
    for (const config of configs.filter((c) => c.enabled)) {
      const plugin = this.plugins.get(config.type)
      const options = plugin?.validateOptions(config.options)
      const reason = !plugin
        ? `no plugin of type ${config.type}`
        : options && !options.ok
          ? options.error.message
          : ids.has(config.id)
            ? "duplicate provider id"
            : checkNumbers(config)
      if (reason || !plugin || !options?.ok) {
        refused.push({ id: config.id, reason: reason ?? "refused" })
        continue
      }
      ids.add(config.id)
      const provider = plugin.create(options.value, { ...deps, id: config.id })
      providers.push({ config, plugin, provider, policy: plugin.security })
    }
    return { providers, refused }
  }
}
