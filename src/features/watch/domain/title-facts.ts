import { memberName, type MemberRef } from "@/shared/domain"
import { placeLabel } from "./places"
import type { Place, Progress } from "./progress-types"

/** A season and how many episodes it has, from the catalog. */
export interface SeasonFact {
  readonly number: number
  readonly episodeCount: number
}

/** One person on the Progress card (Member progress row, 290:9980). */
export interface MemberRow {
  readonly userId: string
  readonly name: string
  readonly me: boolean
  readonly place: string | null
  /** How far through their own season, 0 to 1. */
  readonly fraction: number
  /** Further than you: their place shows in the primary colour. */
  readonly ahead: boolean
}

/** "3 seasons": the meta line never names the type, the seasons say it (Nkosi). */
export const seasonsLabel = (seasons: readonly SeasonFact[]): string | null =>
  seasons.length === 0 ? null : `${seasons.length} ${seasons.length === 1 ? "season" : "seasons"}`

const order = (p: Place) => (p.season ?? 0) * 10_000 + (p.episode ?? 0)

function fraction(place: Place, seasons: readonly SeasonFact[]): number {
  const count = seasons.find((s) => s.number === place.season)?.episodeCount ?? 0
  return count > 0 && place.episode !== null ? Math.min(1, place.episode / count) : 0
}

/** You first, then everyone else in the order the progress came. */
export function memberRows(
  entries: readonly Progress[],
  me: string,
  authors: readonly MemberRef[],
  seasons: readonly SeasonFact[],
): MemberRow[] {
  const mine = entries.find((e) => e.userId === me) ?? { season: null, episode: null }
  const others = entries.filter((e) => e.userId !== me)
  return [{ userId: me, ...mine }, ...others].map((entry) => ({
    userId: entry.userId,
    name:
      entry.userId === me ? `${memberName(authors, me)} (you)` : memberName(authors, entry.userId),
    me: entry.userId === me,
    place: placeLabel(entry),
    fraction: fraction(entry, seasons),
    ahead: entry.userId !== me && order(entry) > order(mine),
  }))
}

/** "E2 to E3" in one season; across seasons each end names its season. */
export function rangeLabel(range: { from: Place; to: Place } | null | undefined): string | null {
  if (!range) return null
  const { from, to } = range
  if (from.season !== to.season) return `${placeLabel(from)} to ${placeLabel(to)}`
  return from.episode === to.episode ? `E${to.episode}` : `E${from.episode} to E${to.episode}`
}

/** What the discussion needs from the title: your place and how many episodes your season has. */
export interface DiscussionFrame {
  readonly place: Place | null
  readonly episodeCount: number
}

/** Your place and your season's length; a film or a title with no catalog has none. */
export function discussionFrame(
  mine: Place | null,
  seasons: readonly SeasonFact[],
): DiscussionFrame | null {
  if (seasons.length === 0) return null
  const season = mine?.season ?? seasons[0]!.number
  const count = seasons.find((s) => s.number === season)?.episodeCount ?? 0
  return { place: mine?.episode != null ? mine : null, episodeCount: count }
}
