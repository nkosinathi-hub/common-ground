import type { Result } from "@/shared/domain"
import type { SearchPage, TitleDetails, TitleRef } from "../domain/types"

export interface SearchRequest {
  readonly spaceId: string
  readonly query: string
  readonly page: number
}

export interface TitleRequest extends TitleRef {
  readonly spaceId: string
}

/**
 * The catalog Edge Function. Implementations stop work when the signal aborts; a result
 * for an aborted call may be discarded by the caller.
 */
export interface CatalogGateway {
  search(request: SearchRequest, signal?: AbortSignal): Promise<Result<SearchPage>>
  details(request: TitleRequest, signal?: AbortSignal): Promise<Result<TitleDetails>>
  refresh(request: TitleRequest, signal?: AbortSignal): Promise<Result<TitleDetails>>
}
