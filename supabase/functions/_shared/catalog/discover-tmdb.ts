import { tmdbGenreIds, type GenreKey } from "./genres.ts"
import { mapTitle, type RawTitle } from "./map-title.ts"
import type { CatalogTitle, CatalogType } from "./types.ts"

/** TMDB discover, popular and streaming in South Africa, for one genre of one type. */
export const discoverPath = (type: CatalogType, genre: GenreKey): string =>
  `discover/${type}?with_genres=${tmdbGenreIds(genre, type).join("|")}&sort_by=popularity.desc` +
  "&vote_count.gte=100&watch_region=ZA&with_watch_monetization_types=flatrate|free|ads" +
  "&include_adult=false&language=en-US&page=1"

export function mapDiscover(raw: unknown, type: CatalogType): CatalogTitle[] {
  const results = (raw as { results?: unknown } | null)?.results
  return (Array.isArray(results) ? (results as RawTitle[]) : [])
    .filter((r) => Number.isSafeInteger(r.id) && (r.id as number) > 0)
    .map((r) => mapTitle(r, type))
}
