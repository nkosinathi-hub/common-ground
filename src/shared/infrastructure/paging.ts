import { nextCursor, PAGE_SIZE, type Cursor, type Page } from "@/shared/domain"

/** PostgREST filter for keyset paging newest-first on (created_at, id). Values are quoted. */
export function olderThan(cursor: Cursor): string {
  const at = `"${cursor.createdAt}"`
  return `created_at.lt.${at},and(created_at.eq.${at},id.lt.${cursor.id})`
}

/** The PostgREST builder calls keyset paging needs, typed by the builder itself. */
interface Pageable<Q> {
  or(filters: string): Q
  order(column: "created_at" | "id", options: { ascending: boolean }): Q
  limit(count: number): Q
}

/** One page newest first on (created_at, id), continuing after the cursor when given. */
export function newestFirst<Q extends Pageable<Q>>(
  query: Q,
  after: Cursor | null,
  size = PAGE_SIZE,
): Q {
  const from = after ? query.or(olderThan(after)) : query
  return from
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(size)
}

/** Maps one page of rows from newestFirst; a full page carries the cursor for the next one. */
export const pageOf =
  <R, T extends Cursor>(map: (row: R) => T) =>
  (rows: readonly R[]): Page<T> => {
    const items = rows.map(map)
    return { items, next: nextCursor(items) }
  }
