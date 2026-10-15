/** Keyset pagination by (created_at, id). */
export interface Cursor {
  readonly createdAt: string
  readonly id: string
}

export interface Page<T> {
  readonly items: readonly T[]
  readonly next: Cursor | null
}

export const PAGE_SIZE = 50

/** A full page means there may be more; the last row is the next cursor. */
export function nextCursor<T extends Cursor>(items: readonly T[], size = PAGE_SIZE): Cursor | null {
  const last = items.at(-1)
  return items.length >= size && last ? { createdAt: last.createdAt, id: last.id } : null
}
