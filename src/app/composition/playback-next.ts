import { ok } from "@/shared/domain"
import type { CatalogService } from "@/features/catalog"
import type { PlayTarget } from "@/features/playback"
import type { MediaRef } from "@/features/playback/domain/media-ref"

/** Resolve the actual following episode, including season boundaries, without a media account. */
export async function catalogNext(catalog: CatalogService, target: PlayTarget, ref: MediaRef) {
  if (ref.kind !== "episode") return ok(null)
  const current = await catalog.season(target.spaceId, target.catalog.id, ref.season)
  if (!current.ok) return current
  const next = [...current.value.episodes]
    .sort((a, b) => a.number - b.number)
    .find((episode) => episode.number > ref.episode)
  if (next) return ok({ season: ref.season, episode: next.number, title: next.name })
  const details = await catalog.details(target.spaceId, target.catalog)
  if (!details.ok) return details
  const seasons = details.value.seasons
    .filter((s) => s.number > ref.season)
    .sort((a, b) => a.number - b.number)
  for (const season of seasons) {
    const result = await catalog.season(target.spaceId, target.catalog.id, season.number)
    if (!result.ok) return result
    const first = [...result.value.episodes].sort((a, b) => a.number - b.number)[0]
    if (first) return ok({ season: season.number, episode: first.number, title: first.name })
  }
  return ok(null)
}
