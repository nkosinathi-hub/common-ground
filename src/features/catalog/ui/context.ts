import { getContext, setContext } from "svelte"
import type { CatalogService } from "../application/catalog-service"

/** Context key under which src/app/composition.ts provides the CatalogService. */
export const CATALOG_CONTEXT = Symbol("catalog-service")

export const setCatalogService = (service: CatalogService): CatalogService =>
  setContext(CATALOG_CONTEXT, service)

export function getCatalogService(): CatalogService {
  const service = getContext<CatalogService | undefined>(CATALOG_CONTEXT)
  if (!service)
    throw new Error(
      "CatalogService is not provided: call setCatalogService in the composition root",
    )
  return service
}
