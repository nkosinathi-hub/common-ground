/** Wire types of the catalog Edge Function. The SPA mirrors these in src/features/catalog/domain. */
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
  readonly link: string | null
  readonly categories: ProviderCategory[]
}

export interface Availability {
  /** ZA first when listed, then every other country sorted by country name. */
  readonly regions: Region[]
  /** True when ZA has no listings and the regions shown are other countries. */
  readonly fallback: boolean
}

export interface TitleDetails {
  readonly title: CatalogTitle
  readonly availability: Availability
}

/** Every successful response says when TMDB was asked and whether it is a stale copy. */
export interface Freshness {
  readonly checkedAt: string
  readonly stale: boolean
}

export type SearchResponse = SearchPage & Freshness
export type DetailsResponse = TitleDetails & Freshness

export type CatalogErrorKind =
  "validation" | "unauthenticated" | "denied" | "not_found" | "rate_limited" | "unavailable"

export interface CatalogErrorBody {
  readonly error: { readonly kind: CatalogErrorKind; readonly message: string }
}
