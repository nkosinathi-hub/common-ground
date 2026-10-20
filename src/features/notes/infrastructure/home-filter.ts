import type { NoteCursor } from "../application/ports"

const q = (value: string) => `"${value}"`

/** Not expired at `now`, and (when paging) after the cursor in pinned, created_at, id order. */
export function homeFilter(now: string, after: NoteCursor | null): string {
  const live = `or(expires_at.is.null,expires_at.gt.${q(now)})`
  if (!after) return live.slice(3, -1)
  const at = q(after.createdAt)
  const older = `created_at.lt.${at},and(created_at.eq.${at},id.lt.${after.id})`
  const later = after.pinned
    ? `or(pinned.eq.false,and(pinned.eq.true,or(${older})))`
    : `and(pinned.eq.false,or(${older}))`
  return `and(${live},${later})`
}

/** The builder calls for ordering an embedded table, typed by the builder itself. */
interface Embedding<Q> {
  order(column: "created_at", options: { referencedTable: string; ascending: boolean }): Q
  limit(count: number, options: { referencedTable: string }): Q
}

/** HOME_COLUMNS embeds `latest` replies and `responses`: keep only the newest of each. */
export const newestEmbeds = <Q extends Embedding<Q>>(query: Q): Q =>
  query
    .order("created_at", { referencedTable: "latest", ascending: false })
    .limit(1, { referencedTable: "latest" })
    .order("created_at", { referencedTable: "responses", ascending: false })
    .limit(1, { referencedTable: "responses" })
