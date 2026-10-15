import type { CatalogTitle, Region, TitleDetails } from "../domain/types"
import { CHECKED_AT } from "./fake-catalog-gateway"

export const SPACE_ID = "0b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f60"

export const title = (
  id: number,
  name: string,
  extra: Partial<CatalogTitle> = {},
): CatalogTitle => ({
  id,
  type: "movie",
  title: name,
  year: 2021,
  mediaKind: "movie",
  posterPath: null,
  synopsis: `${name} synopsis`,
  ...extra,
})

export const region = (code: string, name: string, provider: string): Region => ({
  code,
  name,
  link: `https://www.themoviedb.org/movie/1/watch?locale=${code}`,
  categories: [{ key: "flatrate", label: "Subscription", providers: [provider] }],
})

export const listing = (regions: Region[], fallback: boolean, id = 1): TitleDetails => ({
  title: title(id, "Dune"),
  availability: { regions, fallback },
  checkedAt: CHECKED_AT,
  stale: false,
})
