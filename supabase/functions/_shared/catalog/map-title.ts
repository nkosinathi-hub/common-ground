import { canonicalGenres } from "./genres.ts"
import type { CatalogTitle, CatalogType, MediaKind } from "./types.ts"

/** The subset of a TMDB movie/tv object (search item or details) the catalog reads. */
export interface RawTitle {
  readonly id?: unknown
  readonly media_type?: unknown
  readonly title?: unknown
  readonly name?: unknown
  readonly release_date?: unknown
  readonly first_air_date?: unknown
  readonly overview?: unknown
  readonly poster_path?: unknown
  readonly original_language?: unknown
  readonly genre_ids?: unknown
  readonly genres?: unknown
}

const ANIMATION_GENRE = 16
const POSTER_PATH = /^\/[A-Za-z0-9_.-]+$/

const text = (value: unknown): string => (typeof value === "string" ? value : "")

/** Search items carry genre_ids; details carry genres as objects. */
function genreIds(raw: RawTitle): unknown[] {
  if (Array.isArray(raw.genre_ids)) return raw.genre_ids
  const genres = Array.isArray(raw.genres) ? raw.genres : []
  return genres.map((genre: { id?: unknown } | null) => genre?.id)
}

const isAnimated = (raw: RawTitle): boolean => genreIds(raw).includes(ANIMATION_GENRE)

function yearOf(raw: RawTitle): number | null {
  const year = Number((text(raw.release_date) || text(raw.first_air_date)).slice(0, 4))
  return year >= 1880 && year <= 2100 ? year : null
}

function kindOf(raw: RawTitle, type: CatalogType): MediaKind {
  if (raw.original_language === "ja" && isAnimated(raw)) return "anime"
  return type === "movie" ? "movie" : "series"
}

export function mapTitle(raw: RawTitle, type: CatalogType): CatalogTitle {
  const poster = text(raw.poster_path)
  return {
    id: Number(raw.id),
    type,
    title: (text(raw.title) || text(raw.name) || "Untitled").slice(0, 200),
    year: yearOf(raw),
    mediaKind: kindOf(raw, type),
    posterPath: POSTER_PATH.test(poster) ? poster : null,
    synopsis: text(raw.overview).slice(0, 5000),
    genres: canonicalGenres(genreIds(raw)),
  }
}
