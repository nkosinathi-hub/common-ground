import { PAGE_SIZE } from "@/shared/domain"
import type { WatchCursor, WatchFilters, WatchItem, WatchPage, WatchSort } from "./types"

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

/** Mirrors the where clause of public.list_watch_items. */
export function matches(item: WatchItem, filters: WatchFilters): boolean {
  const search = normaliseSearch(filters.search)
  return (
    (filters.mediaType === null || item.mediaType === filters.mediaType) &&
    (filters.intent === null || item.intent === filters.intent) &&
    (filters.myStatus === null || item.myStatus === filters.myStatus) &&
    (search === "" || item.title.toLowerCase().includes(search))
  )
}

export const sortKeyOf = (item: WatchItem, sort: WatchSort): string =>
  sort === "title" ? item.title.toLowerCase() : item.createdAt

/** Plain string order: -1, 0 or 1. */
const compareText = (a: string, b: string) => Number(a > b) - Number(a < b)

/** Recent: newest first. Title: A to Z. Ties break on id in the same direction as the SQL. */
export function compareFor(sort: WatchSort): (a: WatchItem, b: WatchItem) => number {
  const direction = sort === "title" ? 1 : -1
  return (a, b) =>
    direction * (compareText(sortKeyOf(a, sort), sortKeyOf(b, sort)) || compareText(a.id, b.id))
}

/** Whether an item sorts strictly after the cursor. */
export function isAfter(item: WatchItem, cursor: WatchCursor, sort: WatchSort): boolean {
  const direction = sort === "title" ? 1 : -1
  const order = compareText(sortKeyOf(item, sort), cursor.key) || compareText(item.id, cursor.id)
  return order * direction > 0
}

/** The gateway fetches size + 1 rows; the extra row only proves another page exists. */
export function pageOf(rows: readonly KeyedRow[], size = PAGE_SIZE): WatchPage {
  const page = rows.slice(0, size)
  const last = page.at(-1)
  return {
    items: page.map((row) => row.item),
    next: rows.length > size && last ? { key: last.sortKey, id: last.item.id } : null,
  }
}
