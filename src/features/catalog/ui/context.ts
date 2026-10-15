import { getContext, setContext } from "svelte"
import type { CatalogService } from "../application/catalog-service"

const KEY = Symbol("catalog")

/** Called once by the composition root, above every catalog component. */
export function provideCatalog(service: CatalogService): void {
  setContext(KEY, service)
}

export function useCatalog(): CatalogService {
  const service = getContext<CatalogService | undefined>(KEY)
  if (!service)
    throw new Error("Catalog is not provided: call provideCatalog in the composition root")
  return service
}
