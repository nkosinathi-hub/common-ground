import { appError, err, ok, type Result } from "@/shared/domain"
import { navigationHits, validSearch, type SearchPage } from "../domain/search"

export interface SearchGateway {
  search(
    spaceId: string,
    query: string,
    page: number,
    signal: AbortSignal,
  ): Promise<Result<SearchPage>>
}
export class SearchService {
  constructor(private readonly gateway: SearchGateway) {}
  async search(spaceId: string, query: string, page: number, signal: AbortSignal) {
    if (!spaceId || !validSearch(query) || !Number.isInteger(page) || page < 0)
      return Promise.resolve(err(appError("validation", "Search with 2 to 160 characters")))
    const result = await this.gateway.search(spaceId, query.trim(), page, signal)
    return result.ok
      ? ok({
          ...result.value,
          hits: [
            ...(page === 0 ? navigationHits(spaceId, query.trim()) : []),
            ...result.value.hits,
          ],
        })
      : result
  }
}
