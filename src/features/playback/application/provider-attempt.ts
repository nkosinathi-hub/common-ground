import type { MediaRef } from "../domain/media-ref"
import type { PlaybackLog } from "../domain/plugin.types"
import type { PlaybackPrefs } from "../domain/provider.types"
import type { PlayableSource } from "../domain/source.types"
import { validateSource } from "../domain/validate-source"
import type { RegisteredProvider } from "./plugin-registry"
import { withTimeout } from "./with-timeout"

export interface AttemptContext {
  readonly signal?: AbortSignal
  readonly prefs?: PlaybackPrefs
  readonly log: PlaybackLog
  readonly clock: () => number
  readonly sleep: (ms: number, signal?: AbortSignal) => Promise<void>
  readonly backoffMs: number
}

export interface AttemptOutcome {
  readonly sources: PlayableSource[]
  /** True for timeouts, transient and auth failures: what the circuit breaker counts. */
  readonly unhealthy: boolean
}

/** Keeps only sources from this provider that pass this provider's policy; logs the rest. */
function screen(entry: RegisteredProvider, sources: PlayableSource[], ctx: AttemptContext) {
  const id = entry.config.id
  return sources.flatMap((source) => {
    const checked = validateSource(source, entry.policy)
    const reason =
      source.providerId !== id
        ? `claims provider ${source.providerId}`
        : checked.ok
          ? null
          : checked.error.message
    if (!reason && checked.ok) return [checked.value]
    ctx.log.record({ providerId: id, outcome: "rejected", ms: 0, reason: reason ?? "" })
    return []
  })
}

/** One provider: per-try timeout, retries with doubling backoff for transient errors only. */
export async function attemptProvider(
  entry: RegisteredProvider,
  ref: MediaRef,
  ctx: AttemptContext,
): Promise<AttemptOutcome> {
  const { config, plugin, provider } = entry
  for (let attempt = 0; ; attempt++) {
    const started = ctx.clock()
    const { result, timedOut } = await withTimeout(
      (signal) => provider.resolve(ref, signal, ctx.prefs),
      config.timeoutMs,
      ctx.signal,
    )
    const ms = ctx.clock() - started
    if (result.ok) {
      ctx.log.record({ providerId: config.id, outcome: "ok", ms })
      return { sources: screen(entry, result.value, ctx), unhealthy: false }
    }
    const kind = timedOut ? "transient" : plugin.classifyError(result.error)
    const outcome = timedOut ? "timeout" : "error"
    ctx.log.record({ providerId: config.id, outcome, ms, reason: result.error.message })
    if (kind !== "transient" || attempt >= config.retries || ctx.signal?.aborted)
      return { sources: [], unhealthy: kind !== "permanent" }
    await ctx.sleep(ctx.backoffMs * 2 ** attempt, ctx.signal)
  }
}
