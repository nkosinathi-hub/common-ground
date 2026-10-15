import { type Cursor } from "@/shared/domain"

/** PostgREST filter for rows strictly after the cursor in (created_at desc, id desc) order. */
export function afterCursor(cursor: Cursor): string {
  const at = `"${cursor.createdAt}"`
  return `created_at.lt.${at},and(created_at.eq.${at},id.lt.${cursor.id})`
}
