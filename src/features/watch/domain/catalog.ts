import type { CatalogPick, CatalogType, MediaType } from "./types"

/** Structural shape of a catalog search result (the catalog feature's CatalogTitle). */
export interface CatalogResult {
  readonly id: number
  readonly type: CatalogType
  readonly title: string
  readonly year: number | null
  readonly mediaKind: MediaType
  readonly posterPath: string | null
  readonly synopsis: string
}

export const fromCatalog = (t: CatalogResult): CatalogPick => ({
  catalog: { type: t.type, id: t.id },
  title: t.title,
  mediaType: t.mediaKind,
  releaseYear: t.year,
  synopsis: t.synopsis,
  posterPath: t.posterPath,
})
