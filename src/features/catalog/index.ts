export type {
  Availability as CatalogAvailability,
  CatalogTitle,
  CatalogType,
  MediaKind,
  ProviderCategory,
  Region,
  SearchPage,
  TitleDetails,
  TitleRef,
} from "./domain/types"
export { mediaKindLabel, posterUrl, splitAvailability } from "./domain/rules"
export type { CatalogGateway } from "./application/ports"
export { CatalogService } from "./application/catalog-service"
export { LatestRequest } from "./application/latest-request"
export { SupabaseCatalogGateway } from "./infrastructure/supabase-catalog-gateway"
export { CATALOG_CONTEXT, getCatalogService, setCatalogService } from "./ui/context"
export { default as CatalogSearch } from "./ui/CatalogSearch.svelte"
export { default as Availability } from "./ui/Availability.svelte"
export { default as Attribution } from "./ui/Attribution.svelte"
export { default as Poster } from "./ui/Poster.svelte"
