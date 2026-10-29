import type { Place } from "./places"

/** One watched episode: who has seen it, and the day the space saw it together, if it did. */
export interface EpisodeStatus {
  readonly season: number
  readonly episode: number
  readonly togetherOn: string | null
  readonly watchedBy: readonly string[]
}

export type EpisodeState =
  | { readonly kind: "together"; readonly on: string }
  | { readonly kind: "seen"; readonly by: readonly string[] }
  | { readonly kind: "next" }
  | { readonly kind: "unseen" }

export interface EpisodeRow {
  readonly season: number
  readonly episode: number
  readonly state: EpisodeState
}

/**
 * The Episodes tab's rows for one season (M03b): every episode up to the furthest watched or
 * the next one together, each watched together, seen by some, up next, or not watched yet.
 */
export function episodeRows(
  season: number,
  count: number,
  statuses: readonly EpisodeStatus[],
  together: Place | null,
): EpisodeRow[] {
  const next =
    together?.season === season && together.episode !== null ? together.episode + 1 : null
  return Array.from({ length: count }, (_, i) => {
    const episode = i + 1
    const status = statuses.find((s) => s.season === season && s.episode === episode)
    const state: EpisodeState = status?.togetherOn
      ? { kind: "together", on: status.togetherOn }
      : status
        ? { kind: "seen", by: status.watchedBy }
        : episode === next
          ? { kind: "next" }
          : { kind: "unseen" }
    return { season, episode, state }
  })
}

/** The seasons anyone has reached, at least the first: the season switcher's choices. */
export const seasonsOf = (statuses: readonly EpisodeStatus[], together: Place | null): number[] =>
  [
    ...new Set([
      1,
      ...statuses.map((s) => s.season),
      ...(together?.season ? [together.season] : []),
    ]),
  ]
    .filter((s) => s > 0)
    .sort((a, b) => a - b)
