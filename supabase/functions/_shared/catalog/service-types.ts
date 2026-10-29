import type { CacheStore } from "./cache.ts"
import type { DiscoverRequest } from "./discover-request.ts"
import type { DiscoverResponse } from "./discover.ts"
import type { Outcome } from "../http/outcome.ts"
import type { TmdbClient } from "./tmdb-client.ts"
import type { CatalogType, DetailsResponse, SearchResponse, SeasonResponse } from "./types.ts"

export interface CatalogService {
  search(query: string, page: number): Promise<Outcome<SearchResponse>>
  details(type: CatalogType, id: number): Promise<Outcome<DetailsResponse>>
  refresh(type: CatalogType, id: number): Promise<Outcome<DetailsResponse>>
  season(id: number, season: number): Promise<Outcome<SeasonResponse>>
  /** New titles from your liked titles and genres, leaving out what the request excludes. */
  discover(request: DiscoverRequest): Promise<Outcome<DiscoverResponse>>
}

export interface ServiceDeps {
  readonly cache: CacheStore
  readonly tmdb: TmdbClient
  readonly now?: () => Date
}
