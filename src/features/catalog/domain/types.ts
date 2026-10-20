// The catalog Edge Function's wire types are the contract: the SPA reads them, never a copy.
import type {
  CatalogType,
  DetailsResponse,
  SearchResponse,
} from "../../../../supabase/functions/_shared/catalog/types.ts"

export type {
  Availability,
  CatalogTitle,
  CatalogType,
  Freshness,
  MediaKind,
  ProviderCategory,
  ProviderCategoryKey,
  Region,
} from "../../../../supabase/functions/_shared/catalog/types.ts"

/** A search page with when TMDB was asked. */
export type SearchPage = SearchResponse
/** A title and its availability with when TMDB was asked. */
export type TitleDetails = DetailsResponse

export interface TitleRef {
  readonly type: CatalogType
  readonly id: number
}
