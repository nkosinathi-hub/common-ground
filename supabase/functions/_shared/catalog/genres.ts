// One genre set for films and series. TMDB numbers them apart (Action 28 for films, Action &
// Adventure 10759 for series), so liking a series would never lift a film without this map.
// Shared by the catalog Edge Function, which stores the keys, and the SPA, which names them.

export const GENRE_NAMES = {
  action: "Action",
  adventure: "Adventure",
  animation: "Animation",
  comedy: "Comedy",
  crime: "Crime",
  documentary: "Documentary",
  drama: "Drama",
  family: "Family",
  fantasy: "Fantasy",
  history: "History",
  horror: "Horror",
  music: "Music",
  mystery: "Mystery",
  reality: "Reality",
  romance: "Romance",
  scifi: "Science fiction",
  thriller: "Thriller",
  war: "War",
  western: "Western",
} as const

export type GenreKey = keyof typeof GENRE_NAMES

/** TMDB genre id, film or series, to the canonical keys it stands for. */
const BY_TMDB: Record<number, readonly GenreKey[]> = {
  28: ["action"],
  12: ["adventure"],
  10759: ["action", "adventure"],
  16: ["animation"],
  35: ["comedy"],
  80: ["crime"],
  99: ["documentary"],
  18: ["drama"],
  10766: ["drama"],
  10751: ["family"],
  10762: ["family"],
  14: ["fantasy"],
  878: ["scifi"],
  10765: ["scifi", "fantasy"],
  36: ["history"],
  27: ["horror"],
  10402: ["music"],
  9648: ["mystery"],
  10764: ["reality"],
  10749: ["romance"],
  53: ["thriller"],
  10752: ["war"],
  10768: ["war"],
  37: ["western"],
}

/** The canonical keys of TMDB genre ids; unknown ids (talk, news, TV movie) drop out. */
export function canonicalGenres(ids: readonly unknown[]): GenreKey[] {
  const keys = ids.flatMap((id) => (typeof id === "number" ? (BY_TMDB[id] ?? []) : []))
  return [...new Set(keys)].sort()
}

/** TMDB's own genre lists: discover takes only the ids of the type it searches. */
const FOR_TYPE = {
  movie: [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53, 10752, 37],
  tv: [10759, 16, 35, 80, 99, 18, 10751, 10762, 9648, 10764, 10765, 10766, 10768, 37],
} as const

/** The TMDB ids, for one type, that stand for a canonical key: what discover is asked for. */
export const tmdbGenreIds = (key: GenreKey, type: "movie" | "tv"): number[] =>
  FOR_TYPE[type].filter((id) => BY_TMDB[id]?.includes(key))
