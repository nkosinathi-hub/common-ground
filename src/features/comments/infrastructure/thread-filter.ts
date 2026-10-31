import type { ThreadFilter } from "../application/ports"
import type { EpisodeTag } from "../domain/episodes"

/** PostgREST `or` filters: comments at or before a place (shown) and past it (hidden). */
const shownUpTo = (p: EpisodeTag | null) =>
  p
    ? `season.is.null,season.lt.${p.season},and(season.eq.${p.season},episode.lte.${p.episode})`
    : "season.is.null"

export const pastPlace = (p: EpisodeTag | null) =>
  p
    ? `season.gt.${p.season},and(season.eq.${p.season},episode.gt.${p.episode})`
    : "season.not.is.null"

/** Applies a thread filter to a comments query. */
export function filtered<Q extends { eq(c: string, v: unknown): Q; or(f: string): Q }>(
  query: Q,
  filter: ThreadFilter | undefined,
): Q {
  let next = query
  if (filter?.episode)
    next = next.eq("season", filter.episode.season).eq("episode", filter.episode.episode)
  if (filter && "upTo" in filter) next = next.or(shownUpTo(filter.upTo ?? null))
  return next
}
