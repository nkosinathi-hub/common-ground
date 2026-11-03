import { intentLabel, mediaTypeLabel, statusLabel } from "../domain/labels"
import type { WatchFilters, WatchSort } from "../domain/types"

export const SORTS: readonly { value: WatchSort; label: string }[] = [
  { value: "recent", label: "Recently added" },
  { value: "for_you", label: "For you" },
  { value: "title", label: "Title A to Z" },
]
export const activeChoices = (filters: WatchFilters): string[] =>
  [
    filters.mediaType && mediaTypeLabel(filters.mediaType),
    filters.intent && intentLabel(filters.intent),
    filters.myStatus && statusLabel(filters.myStatus),
    filters.sort !== "recent" && SORTS.find((s) => s.value === filters.sort)?.label,
  ].filter((label): label is string => Boolean(label))
