import { mapNextEpisode, mapRecommendations, mapSeasons, mapTrailer } from "./extras.ts"
import { mapTitle, type RawTitle } from "./map-title.ts"
import { groupProviders } from "./providers.ts"
import type { CatalogType, TitleDetails } from "./types.ts"

const APPENDED = "watch/providers,videos,recommendations"

/** One TMDB request (append_to_response) per title, so the cache keeps it all together. */
export const detailsPath = (type: CatalogType, id: number): string =>
  `${type}/${id}?language=en-US&append_to_response=${APPENDED}`

type RawDetails = RawTitle & {
  "watch/providers"?: { results?: unknown }
  videos?: unknown
  recommendations?: unknown
}

export function mapDetails(raw: unknown, type: CatalogType): TitleDetails {
  const body = (raw ?? {}) as RawDetails
  return {
    title: mapTitle(body, type),
    availability: groupProviders(body["watch/providers"]?.results),
    trailerKey: mapTrailer(body.videos),
    recommendations: mapRecommendations(body.recommendations, type),
    seasons: type === "tv" ? mapSeasons(body) : [],
    nextEpisode: type === "tv" ? mapNextEpisode(body) : null,
  }
}
