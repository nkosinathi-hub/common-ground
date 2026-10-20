// Simkl /sync/all-items replies into watches for public.import_simkl_watches. Simkl's shapes
// are read defensively: anything without a TMDB id, a number or a date is skipped.

/** One watched episode (tv) or film (movie, no season or episode), keyed by TMDB id. */
export interface Watch {
  readonly type: "tv" | "movie"
  readonly tmdb: number
  readonly season: number | null
  readonly episode: number | null
  readonly watched_at: string
}

type Loose = Record<string, unknown>

const MAX_ID = 2147483647
const MAX_NUMBER = 10000

const asObject = (value: unknown): Loose =>
  typeof value === "object" && value !== null ? (value as Loose) : {}

const asList = (value: unknown): Loose[] => (Array.isArray(value) ? value.map(asObject) : [])

function tmdbOf(media: unknown): number | null {
  const raw = asObject(asObject(media).ids).tmdb
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : raw
  return typeof id === "number" && Number.isInteger(id) && id > 0 && id <= MAX_ID ? id : null
}

const numberOf = (value: unknown): number | null =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_NUMBER
    ? value
    : null

function dateOf(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value !== "string") continue
    const time = Date.parse(value)
    if (!Number.isNaN(time)) return new Date(time).toISOString()
  }
  return null
}

function episodesOf(item: Loose, tmdb: number): Watch[] {
  const watches: Watch[] = []
  for (const season of asList(item.seasons)) {
    const seasonNumber = numberOf(season.number)
    if (seasonNumber === null) continue
    for (const episode of asList(season.episodes)) {
      const episodeNumber = numberOf(episode.number)
      const watchedAt = dateOf(episode.watched_at, item.last_watched_at)
      if (episodeNumber === null || !watchedAt) continue
      watches.push({
        type: "tv",
        tmdb,
        season: seasonNumber,
        episode: episodeNumber,
        watched_at: watchedAt,
      })
    }
  }
  return watches
}

/** Every watched episode in a /sync/all-items/shows reply. */
export function showsWatched(body: unknown): Watch[] {
  return asList(asObject(body).shows).flatMap((item) => {
    const tmdb = tmdbOf(item.show)
    return tmdb === null ? [] : episodesOf(item, tmdb)
  })
}

/** Every completed film in a /sync/all-items/movies reply. */
export function moviesWatched(body: unknown): Watch[] {
  return asList(asObject(body).movies).flatMap((item): Watch[] => {
    const tmdb = tmdbOf(item.movie)
    const watchedAt = dateOf(item.last_watched_at)
    if (item.status !== "completed" || tmdb === null || !watchedAt) return []
    return [{ type: "movie", tmdb, season: null, episode: null, watched_at: watchedAt }]
  })
}
