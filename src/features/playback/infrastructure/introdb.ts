import type { MediaRef } from "../domain/media-ref"
import type { Segment, SegmentKind } from "../domain/source.types"

export const INTRO_ORIGIN = "https://api.theintrodb.org"

/** Optional community timing data, in milliseconds. Unknown intro endpoints are never guessed. */
export async function introSegments(
  fetcher: typeof fetch,
  ref: MediaRef,
  parent?: AbortSignal,
): Promise<Segment[]> {
  const query = new URLSearchParams({ tmdb_id: String(ref.tmdbId) })
  if (ref.kind === "episode") {
    query.set("season", String(ref.season))
    query.set("episode", String(ref.episode))
  }
  try {
    const signal = AbortSignal.timeout(2500)
    const response = await fetcher(`${INTRO_ORIGIN}/v3/media?${query}`, {
      signal: parent ? AbortSignal.any([signal, parent]) : signal,
    })
    if (!response.ok) return []
    const data = (await response.json()) as Record<string, unknown>
    const kinds: SegmentKind[] = ["intro", "recap", "credits", "preview"]
    return kinds.flatMap((kind) => {
      const entries = data[kind]
      if (!Array.isArray(entries)) return []
      return entries.flatMap((entry: { start_ms?: unknown; end_ms?: unknown }) => {
        if (!entry) return []
        const start = typeof entry.start_ms === "number" ? entry.start_ms / 1000 : NaN
        const end =
          typeof entry.end_ms === "number"
            ? entry.end_ms / 1000
            : kind === "credits" && entry.end_ms === null
              ? Infinity
              : NaN
        return Number.isFinite(start) && start >= 0 && end > start ? [{ kind, start, end }] : []
      })
    })
  } catch {
    return []
  }
}
