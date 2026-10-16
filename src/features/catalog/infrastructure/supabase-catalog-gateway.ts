import type { Result } from "@/shared/domain"
import { invokeFunction } from "@/shared/infrastructure/functions"
import type { Db } from "@/shared/infrastructure/supabase"
import type { CatalogGateway, SearchRequest, TitleRequest } from "../application/ports"
import type { SearchPage, TitleDetails } from "../domain/types"
import { CATALOG_COPY } from "./catalog-errors"

type Functions = Pick<Db, "functions">

/** Calls the catalog Edge Function; the user's JWT is attached by the Supabase client. */
export class SupabaseCatalogGateway implements CatalogGateway {
  constructor(private readonly db: Functions) {}

  private invoke<T>(body: Record<string, unknown>, signal?: AbortSignal): Promise<Result<T>> {
    return invokeFunction<T>(this.db, "catalog", body, CATALOG_COPY, signal)
  }

  search({ spaceId, query, page }: SearchRequest, signal?: AbortSignal) {
    return this.invoke<SearchPage>({ action: "search", spaceId, q: query, page }, signal)
  }

  details({ spaceId, type, id }: TitleRequest, signal?: AbortSignal) {
    return this.invoke<TitleDetails>({ action: "details", spaceId, type, id }, signal)
  }

  refresh({ spaceId, type, id }: TitleRequest, signal?: AbortSignal) {
    return this.invoke<TitleDetails>({ action: "refresh", spaceId, type, id }, signal)
  }
}
