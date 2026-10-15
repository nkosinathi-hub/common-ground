import type { MediaType, ProgressStatus, SharedIntent } from "./types"

export const MEDIA_TYPES: readonly { value: MediaType; label: string }[] = [
  { value: "movie", label: "Movie" },
  { value: "series", label: "Series" },
  { value: "anime", label: "Anime" },
]

export const INTENTS: readonly { value: SharedIntent; label: string }[] = [
  { value: "watch_together", label: "Watch together" },
  { value: "want_to_watch", label: "Want to watch" },
  { value: "archived", label: "Archived" },
]

export const STATUSES: readonly { value: ProgressStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "watching", label: "Watching" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
]

const labelOf = <T extends string>(list: readonly { value: T; label: string }[], value: T) =>
  list.find((entry) => entry.value === value)?.label ?? value

export const mediaTypeLabel = (value: MediaType) => labelOf(MEDIA_TYPES, value)
export const intentLabel = (value: SharedIntent) => labelOf(INTENTS, value)
export const statusLabel = (value: ProgressStatus) => labelOf(STATUSES, value)

/** "Watching, season 2 episode 4, 4/5" for a progress line. */
export function progressSummary(p: {
  status: ProgressStatus
  season: number | null
  episode: number | null
  rating: number | null
}): string {
  const place = [
    p.season !== null ? `season ${p.season}` : "",
    p.episode !== null ? `episode ${p.episode}` : "",
  ]
    .filter(Boolean)
    .join(" ")
  return [statusLabel(p.status), place, p.rating !== null ? `${p.rating}/5` : ""]
    .filter(Boolean)
    .join(", ")
}
