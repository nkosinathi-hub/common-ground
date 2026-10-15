import { mapTitle, type RawTitle } from "./map-title.ts"
import { groupProviders } from "./providers.ts"
import type { CatalogType, TitleDetails } from "./types.ts"

export const detailsPath = (type: CatalogType, id: number): string =>
  `${type}/${id}?language=en-US&append_to_response=watch/providers`

export function mapDetails(raw: unknown, type: CatalogType): TitleDetails {
  const body = (raw ?? {}) as RawTitle & { "watch/providers"?: { results?: unknown } }
  return {
    title: mapTitle(body, type),
    availability: groupProviders(body["watch/providers"]?.results),
  }
}
