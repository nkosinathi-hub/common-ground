import { PAGE_SIZE } from "@/shared/domain"
import type { WatchFilters, WatchItem, WatchPage, MediaType } from "./types"

export interface KeyedRow {
  readonly item: WatchItem
  readonly sortKey: string
}

export const SEARCH_MAX = 100

export const DEFAULT_FILTERS: WatchFilters = {
  mediaType: null,
  intent: null,
  myStatus: null,
  search: "",
  sort: "recent",
}

export const normaliseSearch = (search: string): string =>
  search.trim().slice(0, SEARCH_MAX).toLowerCase()

/** True when the list is narrowed, so an empty result means "no match", not "nothing yet". */
export const hasActiveFilters = (filters: WatchFilters): boolean =>
  filters.mediaType !== null ||
  filters.intent !== null ||
  filters.myStatus !== null ||
  normaliseSearch(filters.search) !== ""

/** The gateway fetches size + 1 rows; the extra row only proves another page exists. */
export function pageOf(rows: readonly KeyedRow[], size = PAGE_SIZE): WatchPage {
  const page = rows.slice(0, size)
  const last = page.at(-1)
  return {
    items: page.map((row) => row.item),
    next: rows.length > size && last ? { key: last.sortKey, id: last.item.id } : null,
  }
}

/** Titles per type for the library's type filter (D02: "All 3 · Movies 1 · Series 2"). */
export function countTypes(types: readonly MediaType[]): Record<MediaType, number> {
  const counts: Record<MediaType, number> = { movie: 0, series: 0, anime: 0 }
  for (const type of types) counts[type] += 1
  return counts
}
