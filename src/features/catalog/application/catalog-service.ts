import type { Result } from "@/shared/domain"
import { validatePage, validateQuery } from "../domain/rules"
import type { SearchPage, TitleDetails, TitleRef } from "../domain/types"
import type { CatalogGateway } from "./ports"

const SHARE_MS = 60_000

export interface SearchInput {
  readonly spaceId: string
  /** As typed: trimmed and checked here. */
  readonly query: string
  readonly page?: number
}

/** Catalog use cases. Every call takes an optional AbortSignal so stale requests can be cancelled. */
export class CatalogService {
  /** A title page asks for the same details from several places; they share one request. */
  private readonly recent = new Map<string, { at: number; reply: Promise<Result<TitleDetails>> }>()

  constructor(
    private readonly gateway: CatalogGateway,
    private readonly now: () => number = Date.now,
  ) {}

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

  /** The signal is accepted for symmetry but not passed on: other callers may share the reply. */
  details(spaceId: string, ref: TitleRef, _signal?: AbortSignal): Promise<Result<TitleDetails>> {
    const key = `${spaceId}:${ref.type}:${ref.id}`
    const hit = this.recent.get(key)
    if (hit && this.now() - hit.at < SHARE_MS) return hit.reply
    return this.remember(key, this.gateway.details({ spaceId, type: ref.type, id: ref.id }))
  }

  season(spaceId: string, id: number, season: number, signal?: AbortSignal) {
    return this.gateway.season({ spaceId, id, season }, signal)
  }

  /** Expires the cached listing for this title and asks TMDB again. */
  refresh(spaceId: string, ref: TitleRef, signal?: AbortSignal): Promise<Result<TitleDetails>> {
    const reply = this.gateway.refresh({ spaceId, type: ref.type, id: ref.id }, signal)
    return this.remember(`${spaceId}:${ref.type}:${ref.id}`, reply)
  }

  /** A failure is never shared: the next caller asks again. */
  private remember(key: string, reply: Promise<Result<TitleDetails>>) {
    const shared = reply.then((result) => {
      if (!result.ok) this.recent.delete(key)
      return result
    })
    this.recent.set(key, { at: this.now(), reply: shared })
    return shared
  }
}
