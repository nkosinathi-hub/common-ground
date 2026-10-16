import { getContext, setContext } from "svelte"
import type { CatalogService } from "../application/catalog-service"

const KEY = Symbol("catalog")

export interface CatalogContext {
  readonly service: CatalogService
}

/** Called once by the composition root, above every catalog component. */
export function provideCatalog(value: CatalogContext): void {
  setContext(KEY, value)
}

export function useCatalog(): CatalogContext {
  const value = getContext<CatalogContext | undefined>(KEY)
  if (!value)
    throw new Error("Catalog is not provided: call provideCatalog in the composition root")
  return value
}
