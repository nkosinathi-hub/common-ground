// The catalog Edge Function's wire types are the contract: the SPA reads them, never a copy.
import type {
  CatalogType,
  DetailsResponse,
  SearchResponse,
  SeasonResponse,
} from "../../../../supabase/functions/_shared/catalog/types.ts"

export type {
  Availability,
  CatalogTitle,
  CatalogType,
  Episode,
  Freshness,
  MediaKind,
  ProviderCategory,
  ProviderCategoryKey,
  NextEpisode,
  Region,
  Season,
} from "../../../../supabase/functions/_shared/catalog/types.ts"

/** A search page with when TMDB was asked. */
export type SearchPage = SearchResponse
/** A title and its availability with when TMDB was asked. */
export type TitleDetails = DetailsResponse
/** One season's episodes with when TMDB was asked. */
export type SeasonPage = SeasonResponse

export interface TitleRef {
  readonly type: CatalogType
  readonly id: number
}
