import type { Cursor } from "@/shared/domain"

/** PostgREST filter for keyset paging newest-first on (created_at, id). Values are quoted. */
export function olderThan(cursor: Cursor): string {
  const at = `"${cursor.createdAt}"`
  return `created_at.lt.${at},and(created_at.eq.${at},id.lt.${cursor.id})`
}
