import { PAGE_SIZE } from "@/shared/domain"
import type { WatchCursor, WatchFilters, WatchItem, WatchPage, WatchSort } from "./types"

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
export const hasActiveFilters = (f: WatchFilters): boolean =>
  f.mediaType !== null ||
  f.intent !== null ||
  f.myStatus !== null ||
  normaliseSearch(f.search) !== ""

/** Mirrors the where clause of public.list_watch_items. */
export function matches(item: WatchItem, f: WatchFilters): boolean {
  const search = normaliseSearch(f.search)
  return (
    (f.mediaType === null || item.mediaType === f.mediaType) &&
    (f.intent === null || item.intent === f.intent) &&
    (f.myStatus === null || item.myStatus === f.myStatus) &&
    (search === "" || item.title.toLowerCase().includes(search))
  )
}

export const sortKeyOf = (item: WatchItem, sort: WatchSort): string =>
  sort === "title" ? item.title.toLowerCase() : item.createdAt

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

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

export interface KeyedRow {
  readonly item: WatchItem
  readonly sortKey: string
}

export function pageOf(rows: readonly KeyedRow[], size = PAGE_SIZE): WatchPage {
  const last = rows.at(-1)
  return {
    items: rows.map((r) => r.item),
    next: rows.length >= size && last ? { key: last.sortKey, id: last.item.id } : null,
  }
}
