import { appError, err, ok, type Result } from "../../../shared/domain/result"

/** A title to play, keyed by its TMDB id; an episode also names its season and number. */
export type MediaRef =
  | { readonly kind: "movie"; readonly tmdbId: number }
  | {
      readonly kind: "episode"
      readonly tmdbId: number
      readonly season: number
      readonly episode: number
    }

const counting = (n: number) => Number.isInteger(n) && n >= 1

export function movieRef(tmdbId: number): Result<MediaRef> {
  if (!counting(tmdbId)) return err(appError("validation", "Not a TMDB id", "tmdbId"))
  return ok({ kind: "movie", tmdbId })
}

/** Season 0 holds specials, which are never "the next episode", so playable seasons start at 1. */
export function episodeRef(tmdbId: number, season: number, episode: number): Result<MediaRef> {
  if (!counting(tmdbId)) return err(appError("validation", "Not a TMDB id", "tmdbId"))
  if (!counting(season)) return err(appError("validation", "Seasons start at 1", "season"))
  if (!counting(episode)) return err(appError("validation", "Episodes start at 1", "episode"))
  return ok({ kind: "episode", tmdbId, season, episode })
}

export function refLabel(ref: MediaRef): string {
  return ref.kind === "episode" ? `S${ref.season}E${ref.episode}` : `movie ${ref.tmdbId}`
}
