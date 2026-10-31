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

/** A card's quiet line: your status unless not started, the year, and why For you put it here. */
export const cardMeta = (
  item: { myStatus: ProgressStatus; releaseYear: number | null; reason?: string | null },
  genreName: (key: string) => string,
): string[] =>
  [
    item.myStatus !== "not_started" && statusLabel(item.myStatus),
    item.releaseYear,
    item.reason && `Because you liked ${genreName(item.reason)}`,
  ]
    .filter((part): part is string | number => Boolean(part))
    .map(String)

/** The list RPC returns status as text; anything unknown reads as not started. */
export const progressStatusOf = (raw: string | null | undefined): ProgressStatus =>
  STATUSES.find((entry) => entry.value === raw)?.value ?? "not_started"
