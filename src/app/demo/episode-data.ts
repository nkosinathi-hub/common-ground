import { today } from "./identity"
import { watchRows } from "./watch-data"

/** episode_statuses for the sample space: each person saw every episode up to their place. */
export function demoEpisodeStatuses(itemId: unknown) {
  const item = watchRows.find((row) => row.id === itemId)
  if (!item) return []
  const seen = new Map<
    string,
    { season: number; episode: number; together_on: string | null; watched_by: string[] }
  >()
  for (const place of item.places) {
    if (place.season === null || place.episode === null) continue
    for (let episode = 1; episode <= place.episode; episode++) {
      const key = `${place.season}:${episode}`
      const together =
        item.together && item.together.season === place.season && episode <= item.together.episode
      const row = seen.get(key) ?? {
        season: place.season,
        episode,
        together_on: together ? today : null,
        watched_by: [],
      }
      row.watched_by.push(place.user_id)
      seen.set(key, row)
    }
  }
  return [...seen.values()].sort((a, b) => a.season - b.season || a.episode - b.episode)
}
