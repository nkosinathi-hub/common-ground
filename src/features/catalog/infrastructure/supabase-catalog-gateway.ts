import { invokeFunction } from "@/shared/infrastructure/functions"
import type { Db } from "@/shared/infrastructure/supabase"
import { map, type Result } from "@/shared/domain"
import type {
  CatalogGateway,
  SearchRequest,
  SeasonRequest,
  TitleRequest,
} from "../application/ports"
import type { SearchPage, SeasonPage, TitleDetails } from "../domain/types"
import { CATALOG_COPY } from "./catalog-errors"

type Functions = Pick<Db, "functions">

/** Details cached before v0.5 lack the extras for up to a day; they read as none. */
const complete = (details: TitleDetails): TitleDetails => ({
  ...details,
  trailerKey: details.trailerKey ?? null,
  recommendations: details.recommendations ?? [],
  seasons: details.seasons ?? [],
  nextEpisode: details.nextEpisode ?? null,
})

/** Calls the catalog Edge Function; the user's JWT is attached by the Supabase client. */
export class SupabaseCatalogGateway implements CatalogGateway {
  constructor(private readonly db: Functions) {}

  private invoke<T>(body: Record<string, unknown>, signal?: AbortSignal): Promise<Result<T>> {
    return invokeFunction<T>(this.db, "catalog", body, CATALOG_COPY, signal)
  }

  search({ spaceId, query, page }: SearchRequest, signal?: AbortSignal) {
    return this.invoke<SearchPage>({ action: "search", spaceId, q: query, page }, signal)
  }

  async details({ spaceId, type, id }: TitleRequest, signal?: AbortSignal) {
    const reply = await this.invoke<TitleDetails>({ action: "details", spaceId, type, id }, signal)
    return map(reply, complete)
  }

  async refresh({ spaceId, type, id }: TitleRequest, signal?: AbortSignal) {
    const reply = await this.invoke<TitleDetails>({ action: "refresh", spaceId, type, id }, signal)
    return map(reply, complete)
  }

  season({ spaceId, id, season }: SeasonRequest, signal?: AbortSignal) {
    return this.invoke<SeasonPage>({ action: "season", spaceId, type: "tv", id, season }, signal)
  }
}
