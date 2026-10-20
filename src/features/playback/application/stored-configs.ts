import type { ProviderConfig } from "../domain/provider.types"

interface Choice {
  readonly id?: unknown
  readonly enabled?: unknown
  readonly priority?: unknown
}

function parse(raw: string | null): Choice[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? (value as Choice[]) : []
  } catch {
    return []
  }
}

/**
 * Applies one person's stored choices (on or off, and order) to the build's provider configs.
 * Storage can never add a provider, change its type, options or limits: what plays, and from
 * where, is fixed at build time.
 */
export function withStoredChoices(
  defaults: readonly ProviderConfig[],
  raw: string | null,
): ProviderConfig[] {
  const choices = parse(raw)
  return defaults.map((config) => {
    const choice = choices.find((c) => c?.id === config.id)
    if (!choice) return config
    const enabled = typeof choice.enabled === "boolean" ? { enabled: choice.enabled } : {}
    const priority =
      typeof choice.priority === "number" && Number.isFinite(choice.priority)
        ? { priority: choice.priority }
        : {}
    return { ...config, ...enabled, ...priority }
  })
}
