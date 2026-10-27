import { map } from "@/shared/domain"
import type { CatalogService } from "@/features/catalog"
import type { PlaybackCatalog } from "@/features/playback/application/ports"

/** Keeps catalog response types out of the playback feature boundary. */
export function playbackCatalog(catalog: CatalogService): PlaybackCatalog {
  return {
    details: async (spaceId, type, id) =>
      map(await catalog.details(spaceId, { type, id }), (details) => ({
        trailerAvailable: details.trailerKey !== null,
        seasons: details.seasons,
      })),
    season: (spaceId, id, season) => catalog.season(spaceId, id, season),
  }
}
