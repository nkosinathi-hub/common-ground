import { map, ok, type Result } from "@/shared/domain"
import type { CatalogService, TitleDetails } from "@/features/catalog"
import type { MediaRef } from "@/features/playback/domain/media-ref"
import type { TmdbLookup } from "@/features/playback/domain/plugin.types"

/**
 * The playback plugins' TMDB lookups (trailers, IMDb ids for the Internet Archive), from the
 * catalog Edge Function in the space being viewed. One call per title serves both; a failure
 * is not remembered, so the next play tries again.
 */
export function catalogTmdb(catalog: CatalogService, activeSpace: () => string | null): TmdbLookup {
  const seen = new Map<string, Promise<Result<TitleDetails>>>()

  function details(ref: MediaRef, signal: AbortSignal): Promise<Result<TitleDetails>> | null {
    const spaceId = activeSpace()
    if (!spaceId) return null
    const title = { type: ref.kind === "movie" ? "movie" : "tv", id: ref.tmdbId } as const
    const key = `${title.type}:${title.id}`
    const cached = seen.get(key)
    if (cached) return cached
    const pending = catalog.details(spaceId, title, signal)
    seen.set(key, pending)
    void pending.then((result) => !result.ok && seen.delete(key))
    return pending
  }

  return {
    imdbId: async (ref, signal) => {
      const found = details(ref, signal)
      return found ? map(await found, (d) => d.imdbId) : ok(null)
    },
    videos: async (ref, signal) => {
      const found = details(ref, signal)
      if (!found) return ok([])
      return map(await found, (d) =>
        d.trailerKey
          ? [{ key: d.trailerKey, site: "YouTube", type: "Trailer", official: true }]
          : [],
      )
    },
  }
}
