import type { WatchCursor, WatchFilters, WatchItem, WatchSort } from "../domain/types"
import { normaliseSearch } from "../domain/filters"

/** In-memory mirrors of list_watch_items (where, order, keyset) and the watch_items unique rules. */

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

/** The two unique rules of watch_items: catalog id per type, or manual title per media type. */
export function isDuplicate(items: readonly WatchItem[], extra: Partial<WatchItem>, title: string) {
  return items.some((i) =>
    extra.catalog
      ? i.catalog?.type === extra.catalog.type && i.catalog.id === extra.catalog.id
      : !i.catalog &&
        i.title.toLowerCase() === title.toLowerCase() &&
        i.mediaType === extra.mediaType,
  )
}
