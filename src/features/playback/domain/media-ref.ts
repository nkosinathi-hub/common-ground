import { appError, err, ok, type Result } from "../../../shared/domain/result"

/** A title to play, keyed by its TMDB id; an episode also names its season and number. */
export type MediaRef =
  | { readonly kind: "movie"; readonly tmdbId: number }
  | {
      readonly kind: "episode"
      readonly tmdbId: number
      readonly season: number
      readonly episode: number
      /** TMDB's own id for the episode, when the catalog knows it; matched before numbers. */
      readonly episodeTmdbId?: number
    }

const counting = (n: number) => Number.isInteger(n) && n >= 1
const notTmdb = (field: string) => err(appError("validation", "Not a TMDB id", field))

export function movieRef(tmdbId: number): Result<MediaRef> {
  if (!counting(tmdbId)) return notTmdb("tmdbId")
  return ok({ kind: "movie", tmdbId })
}

/** Season 0 holds specials, which are never "the next episode", so playable seasons start at 1. */
export function episodeRef(
  tmdbId: number,
  season: number,
  episode: number,
  episodeTmdbId?: number,
): Result<MediaRef> {
  if (!counting(tmdbId)) return notTmdb("tmdbId")
  if (!counting(season)) return err(appError("validation", "Seasons start at 1", "season"))
  if (!counting(episode)) return err(appError("validation", "Episodes start at 1", "episode"))
  if (episodeTmdbId !== undefined && !counting(episodeTmdbId)) return notTmdb("episodeTmdbId")
  const own = episodeTmdbId === undefined ? {} : { episodeTmdbId }
  return ok({ kind: "episode", tmdbId, season, episode, ...own })
}

export function refLabel(ref: MediaRef): string {
  return ref.kind === "episode" ? `S${ref.season}E${ref.episode}` : `movie ${ref.tmdbId}`
}
