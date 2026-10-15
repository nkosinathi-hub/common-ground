import type { Result } from "@/shared/domain"
import { validatePage, validateQuery } from "../domain/rules"
import type { SearchPage, TitleDetails, TitleRef } from "../domain/types"
import type { CatalogGateway } from "./ports"

export interface SearchInput {
  readonly spaceId: string
  /** As typed: trimmed and checked here. */
  readonly query: string
  readonly page?: number
}

/** Catalog use cases. Every call takes an optional AbortSignal so stale requests can be cancelled. */
export class CatalogService {
  constructor(private readonly gateway: CatalogGateway) {}

  async search(
    { spaceId, query, page = 1 }: SearchInput,
    signal?: AbortSignal,
  ): Promise<Result<SearchPage>> {
    const validQuery = validateQuery(query)
    if (!validQuery.ok) return validQuery
    const validPage = validatePage(page)
    if (!validPage.ok) return validPage
    return this.gateway.search({ spaceId, query: validQuery.value, page: validPage.value }, signal)
  }

  details(spaceId: string, ref: TitleRef, signal?: AbortSignal): Promise<Result<TitleDetails>> {
    return this.gateway.details({ spaceId, type: ref.type, id: ref.id }, signal)
  }

  /** Expires the cached listing for this title and asks TMDB again. */
  refresh(spaceId: string, ref: TitleRef, signal?: AbortSignal): Promise<Result<TitleDetails>> {
    return this.gateway.refresh({ spaceId, type: ref.type, id: ref.id }, signal)
  }
}
