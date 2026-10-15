// Mirrors supabase/functions/_shared/catalog/types.ts (the catalog Edge Function response).
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

export type ProviderCategoryKey = "flatrate" | "free" | "ads" | "rent" | "buy"

export interface ProviderCategory {
  readonly key: ProviderCategoryKey
  readonly label: string
  readonly providers: readonly string[]
}

export interface Region {
  readonly code: string
  readonly name: string
  /** Country-level TMDB or JustWatch page; never a provider deep link. */
  readonly link: string | null
  readonly categories: readonly ProviderCategory[]
}

export interface Availability {
  readonly regions: readonly Region[]
  readonly fallback: boolean
}

export interface Freshness {
  /** ISO timestamp of when TMDB was last asked. */
  readonly checkedAt: string
  /** True when TMDB was down and this is an older cached copy. */
  readonly stale: boolean
}

export interface SearchPage extends Freshness {
  readonly results: readonly CatalogTitle[]
  readonly page: number
  readonly totalPages: number
}

export interface TitleDetails extends Freshness {
  readonly title: CatalogTitle
  readonly availability: Availability
}

export interface TitleRef {
  readonly type: CatalogType
  readonly id: number
}
