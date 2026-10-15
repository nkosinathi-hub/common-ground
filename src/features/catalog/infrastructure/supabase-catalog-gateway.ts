import { appError, err, ok, type Result } from "@/shared/domain"
import type { Db } from "@/shared/infrastructure/supabase"
import type { CatalogGateway, SearchRequest, TitleRequest } from "../application/ports"
import type { SearchPage, TitleDetails } from "../domain/types"
import { OUTAGE_MESSAGE, toCatalogError } from "./catalog-errors"

type Functions = Pick<Db, "functions">

/** Calls the catalog Edge Function; the user's JWT is attached by the Supabase client. */
export class SupabaseCatalogGateway implements CatalogGateway {
  constructor(private readonly db: Functions) {}

  private async invoke<T>(body: Record<string, unknown>, signal?: AbortSignal): Promise<Result<T>> {
    try {
      const { data, error } = await this.db.functions.invoke("catalog", { body, signal })
      if (error) return err(await toCatalogError(error))
      return ok(data as T)
    } catch {
      return err(appError("network", OUTAGE_MESSAGE))
    }
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
