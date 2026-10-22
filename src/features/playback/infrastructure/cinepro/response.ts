import type { PlayableSource } from "../../domain/source.types"
import { sameOriginUrl, sourceKind, sourceMime, sourceQuality, sourceSubtitles } from "./source"

interface RawSource {
  readonly url?: unknown
  readonly type?: unknown
  readonly quality?: unknown
  readonly provider?: { readonly id?: unknown; readonly name?: unknown }
}

interface RawPayload {
  readonly responseId?: unknown
  readonly expiresAt?: unknown
  readonly sources?: unknown
  readonly subtitles?: unknown
}

const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null

const text = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined)

/** The id Core needs back for a refresh, and which upstream provider the source came from. */
function providerData(payload: RawPayload, item: RawSource): Record<string, string> {
  const entries: [string, string | undefined][] = [
    ["responseId", text(payload.responseId)],
    ["sourceProviderId", text(item.provider?.id)],
    ["sourceProviderName", text(item.provider?.name)],
  ]
  return Object.fromEntries(entries.filter((e): e is [string, string] => e[1] !== undefined))
}

/**
 * An OMSS SourceResponse to the player's sources: only URLs on the Core origin, only kinds the
 * player has an engine for. Subtitles apply to every source; the quality decides the ranking.
 */
export function toPlayableSources(
  raw: unknown,
  origin: string,
  providerId: string,
): PlayableSource[] {
  const payload = record(raw) as RawPayload | null
  if (!payload || !Array.isArray(payload.sources)) return []
  const subtitles = sourceSubtitles(payload.subtitles, origin)
  const expires = text(payload.expiresAt)
  const expiresAt = expires && Number.isFinite(Date.parse(expires)) ? expires : undefined
  return (payload.sources as unknown[]).flatMap((entry) => {
    const item = (record(entry) ?? {}) as RawSource
    const url = sameOriginUrl(item.url, origin)
    const kind = sourceKind(item.type)
    if (!url || !kind) return []
    const quality = sourceQuality(item.quality)
    const mime = sourceMime(item.type)
    const data = providerData(payload, item)
    return [
      {
        kind,
        url,
        ...(mime ? { mime } : {}),
        ...(quality ? { quality } : {}),
        subtitles,
        segments: [],
        providerId,
        ...(expiresAt ? { expiresAt } : {}),
        ...(Object.keys(data).length ? { providerData: data } : {}),
      } satisfies PlayableSource,
    ]
  })
}
