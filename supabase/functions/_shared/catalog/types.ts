/** Wire types of the catalog Edge Function; src/features/catalog/domain re-exports them. */
export type CatalogType = "movie" | "tv"
export type MediaKind = "movie" | "series" | "anime"

export interface CatalogTitle {
  readonly id: number
  readonly type: CatalogType
  readonly title: string
  readonly year: number | null
  readonly mediaKind: MediaKind
  readonly posterPath: string | null
  readonly synopsis: string
}

export interface SearchPage {
  readonly results: CatalogTitle[]
  readonly page: number
  readonly totalPages: number
}

export type ProviderCategoryKey = "flatrate" | "free" | "ads" | "rent" | "buy"

export interface ProviderCategory {
  readonly key: ProviderCategoryKey
  readonly label: string
  readonly providers: string[]
}

export interface Region {
  readonly code: string
  readonly name: string
  /** Country-level TMDB or JustWatch page; never a provider deep link. */
  readonly link: string | null
  readonly categories: ProviderCategory[]
}

export interface Availability {
  /** ZA first when listed, then every other country sorted by country name. */
  readonly regions: Region[]
  /** True when ZA has no listings and the regions shown are other countries. */
  readonly fallback: boolean
}

export interface Season {
  readonly number: number
  readonly name: string
  readonly episodeCount: number
  readonly airDate: string | null
}

export interface Episode {
  readonly number: number
  readonly name: string
  readonly airDate: string | null
  readonly runtimeMinutes: number | null
}

export interface SeasonDetails {
  readonly number: number
  readonly episodes: Episode[]
}

export interface NextEpisode {
  readonly season: number
  readonly episode: number
  readonly airDate: string | null
}

export interface TitleDetails {
  readonly title: CatalogTitle
  readonly availability: Availability
  /** YouTube key of the official trailer, embedded through youtube-nocookie. */
  readonly trailerKey: string | null
  readonly recommendations: CatalogTitle[]
  /** Series only; empty for a movie. */
  readonly seasons: Season[]
  readonly nextEpisode: NextEpisode | null
  /** IMDb id, which matches public-domain films on the Internet Archive through Wikidata. */
  readonly imdbId: string | null
}

/** Every successful response says when TMDB was asked and whether it is a stale copy. */
export interface Freshness {
  readonly checkedAt: string
  readonly stale: boolean
}

export type SearchResponse = SearchPage & Freshness
export type DetailsResponse = TitleDetails & Freshness
export type SeasonResponse = SeasonDetails & Freshness
