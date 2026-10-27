import { appError, err, ok, type Result } from "../../../shared/domain/result"
import type { MediaRef } from "../domain/media-ref"
import type { PlaybackLog } from "../domain/plugin.types"
import type { PlaybackPrefs, Provider } from "../domain/provider.types"
import { rankSources } from "../domain/ranking"
import type { PlayableSource } from "../domain/source.types"
import type { HealthMonitor } from "./health-monitor"
import type { RegisteredProvider } from "./plugin-registry"
import { attemptProvider } from "./provider-attempt"
import { abortableSleep } from "./with-timeout"

export interface Resolution {
  readonly best: PlayableSource
  /** Next best first; the player moves down this list when a source fails. */
  readonly fallbacks: readonly PlayableSource[]
}

export interface ResolverDeps {
  readonly health: HealthMonitor
  readonly log: PlaybackLog
  readonly clock: () => number
  readonly canPlay: (source: PlayableSource) => boolean
  readonly sleep?: (ms: number, signal?: AbortSignal) => Promise<void>
  readonly backoffMs?: number
}

export interface ResolveOptions {
  readonly signal?: AbortSignal
  readonly prefs?: PlaybackPrefs
  /** Restrict a resolution to one or more explicit providers, for example the trailer action. */
  readonly providerIds?: readonly string[]
  /** Keep implicit fallbacks, such as a trailer, out of the main title action. */
  readonly excludeProviderIds?: readonly string[]
}

/** Asks every capable provider at once; one provider failing never fails the whole resolve. */
export class SourceResolver {
  constructor(
    private readonly providers: readonly RegisteredProvider[],
    private readonly deps: ResolverDeps,
  ) {}

  async resolve(ref: MediaRef, options: ResolveOptions = {}): Promise<Result<Resolution>> {
    const { health, log, clock } = this.deps
    const signal = options.signal ?? new AbortController().signal
    const ctx = {
      ...{ log, clock, signal, sleep: this.deps.sleep ?? abortableSleep },
      ...(options.prefs ? { prefs: options.prefs } : {}),
      backoffMs: this.deps.backoffMs ?? 250,
    }
    const capable = this.providers.filter(
      (e) =>
        (!options.providerIds || options.providerIds.includes(e.config.id)) &&
        !options.excludeProviderIds?.includes(e.config.id) &&
        e.plugin.capabilities.media.includes(ref.kind) &&
        e.provider.supports(ref),
    )
    const found = await Promise.all(
      capable.map(async (entry) => {
        const id = entry.config.id
        if (!(await health.admit(entry, signal))) {
          log.record({ providerId: id, outcome: "skipped", ms: 0, reason: "circuit open" })
          return []
        }
        const outcome = await attemptProvider(entry, ref, ctx)
        if (outcome.unhealthy) health.failure(id)
        else health.success(id)
        return outcome.sources
      }),
    )
    const priority = Object.fromEntries(this.providers.map((e) => [e.config.id, e.config.priority]))
    const [best, ...fallbacks] = rankSources(found.flat(), priority, this.deps.canPlay)
    if (!best) return err(appError("not_found", "Nothing can play this title right now"))
    return ok({ best, fallbacks })
  }

  /** The provider a source came from, for progress reports. */
  providerFor(source: PlayableSource): Provider | undefined {
    return this.providers.find((e) => e.config.id === source.providerId)?.provider
  }
}
