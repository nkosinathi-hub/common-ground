import type { PlayableSource } from "./source.types"

/**
 * Best first: sources this device can play, then the provider's priority (lower is preferred),
 * then quality (higher first, unknown last). Ties keep the order providers returned them.
 */
export function rankSources(
  sources: readonly PlayableSource[],
  priority: Readonly<Record<string, number>>,
  canPlay: (source: PlayableSource) => boolean,
): PlayableSource[] {
  const keyed = sources.map((source, index) => ({
    source,
    index,
    playable: canPlay(source) ? 0 : 1,
    priority: priority[source.providerId] ?? Number.POSITIVE_INFINITY,
    quality: source.quality ?? -1,
  }))
  keyed.sort(
    (a, b) =>
      a.playable - b.playable ||
      a.priority - b.priority ||
      b.quality - a.quality ||
      a.index - b.index,
  )
  return keyed.map((entry) => entry.source)
}
