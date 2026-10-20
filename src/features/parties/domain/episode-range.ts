import { appError, err, ok, type Result } from "@/shared/domain"

export interface EpisodeRef {
  readonly season: number
  readonly episode: number
}

/**
 * The episodes a party watches, first to last. A range that leaves a season needs that season's
 * episode count (from TMDB), one per season from `from.season` up to, not including, `to.season`.
 */
export interface EpisodeRange {
  readonly from: EpisodeRef
  readonly to: EpisodeRef
  readonly seasonEpisodeCounts?: readonly number[]
}

const label = (ref: EpisodeRef) => `S${ref.season}E${ref.episode}`

/** The episode after the together pointer; with the season's length, on into the next season. */
export function nextTogether(together: EpisodeRef | null, seasonLength?: number): EpisodeRef {
  if (!together) return { season: 1, episode: 1 }
  if (seasonLength !== undefined && together.episode >= seasonLength)
    return { season: together.season + 1, episode: 1 }
  return { season: together.season, episode: together.episode + 1 }
}

const backwards = (r: EpisodeRange) =>
  r.to.season < r.from.season || (r.to.season === r.from.season && r.to.episode < r.from.episode)

/** The same rules start_party applies, so the form can say what is wrong before sending. */
export function validateRange(range: EpisodeRange): Result<void> {
  const { from, to } = range
  if (from.season < 0 || from.episode < 1 || to.episode < 1 || backwards(range))
    return err(appError("validation", "Choose the episodes you will watch, first to last", "range"))
  if (to.season === from.season) return ok(undefined)
  const counts = range.seasonEpisodeCounts ?? []
  if (
    counts.length !== to.season - from.season ||
    counts.some((c) => c < 1) ||
    from.episode > counts[0]!
  )
    return err(
      appError("validation", "Each season the party leaves needs its episode count", "range"),
    )
  return ok(undefined)
}

export const describeRange = (range: EpisodeRange): string =>
  range.from.season === range.to.season && range.from.episode === range.to.episode
    ? label(range.from)
    : `${label(range.from)} to ${label(range.to)}`

/** How many episodes a valid range covers. */
export function episodeCount(range: EpisodeRange): number {
  let total = 0
  for (let season = range.from.season; season <= range.to.season; season++) {
    const first = season === range.from.season ? range.from.episode : 1
    const last =
      season === range.to.season
        ? range.to.episode
        : range.seasonEpisodeCounts![season - range.from.season]!
    total += last - first + 1
  }
  return total
}
