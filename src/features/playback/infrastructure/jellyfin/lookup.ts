import { appError, err, ok, type Result } from "../../../../shared/domain/result"
import type { MediaRef } from "../../domain/media-ref"
import type { JellyfinSession } from "./client"
import { itemsOf, type JellyfinItem } from "./items"

const missing = () => err(appError("not_found", "Not in this Jellyfin library"))

/** TMDB id to the library's movie or series, matched on ProviderIds.Tmdb; cached per provider. */
export async function findTitle(
  session: JellyfinSession,
  ref: MediaRef,
  cache: Map<string, JellyfinItem>,
  signal: AbortSignal,
): Promise<Result<JellyfinItem>> {
  const type = ref.kind === "movie" ? "Movie" : "Series"
  const key = `${type}:${ref.tmdbId}`
  const cached = cache.get(key)
  // A series is only a parent; a movie is fetched again so its resume point is fresh.
  if (cached && type === "Series") return ok(cached)
  const query = {
    ...{ userId: session.credential.userId, hasTmdbId: true, fields: "ProviderIds" },
    ...{ includeItemTypes: "Movie,Series", recursive: true },
  }
  const reply = await session.get("/Items", query, signal)
  if (!reply.ok) return reply
  for (const item of itemsOf(reply.value)) {
    if (item.ProviderIds?.Tmdb) cache.set(`${item.Type}:${item.ProviderIds.Tmdb}`, item)
  }
  const found = cache.get(key)
  return found ? ok(found) : missing()
}

const covers = (item: JellyfinItem, season: number, episode: number) =>
  item.ParentIndexNumber === season &&
  item.IndexNumber !== undefined &&
  episode >= item.IndexNumber &&
  episode <= (item.IndexNumberEnd ?? item.IndexNumber)

/** The episode's own TMDB id wins; otherwise season and number, a multi-episode file by range. */
export async function findEpisode(
  session: JellyfinSession,
  series: JellyfinItem,
  ref: Extract<MediaRef, { kind: "episode" }>,
  flagMismatch: (reason: string) => void,
  signal: AbortSignal,
): Promise<Result<JellyfinItem>> {
  const query = { userId: session.credential.userId, fields: "ProviderIds" }
  const reply = await session.get(`/Shows/${series.Id}/Episodes`, query, signal)
  if (!reply.ok) return reply
  const episodes = itemsOf(reply.value)
  const own = ref.episodeTmdbId ? String(ref.episodeTmdbId) : null
  const byId = own ? episodes.find((e) => e.ProviderIds?.Tmdb === own) : undefined
  if (byId && !covers(byId, ref.season, ref.episode)) {
    const reason = `TMDB episode ${own} is S${byId.ParentIndexNumber}E${byId.IndexNumber} in Jellyfin`
    flagMismatch(reason)
  }
  const found = byId ?? episodes.find((e) => covers(e, ref.season, ref.episode))
  return found ? ok(found) : missing()
}
