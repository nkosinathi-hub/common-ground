import { forYou, forYouRank } from "@/features/watch/domain/for-you"
import type { Opinion } from "@/features/watch/domain/progress-types"
import { tables, type DemoRow } from "./tables"

/** The demo's watch_for_you: the same scoring as the database, over the sample rows. */
export function demoForYou(space: unknown) {
  const rows = (tables.watch_items ?? []).filter((row) => row.space_id === space)
  const opinions = new Map(
    (tables.watch_opinions ?? []).map((o) => [o.watch_item_id as string, o.opinion as Opinion]),
  )
  const titles = rows.map((row) => ({
    id: row.id as string,
    genres: (row.genres as string[]) ?? [],
    streamable: Boolean(row.streamable),
  }))
  return forYou(titles, opinions)
}

/** list_watch_items sorted For you: best fit first, dislikes last, each with its reason. */
export function sortForYou(rows: DemoRow[], space: unknown): DemoRow[] {
  const scores = new Map(demoForYou(space).map((s) => [s.itemId, s]))
  const key = (row: DemoRow) => {
    const s = scores.get(row.id as string)
    return s ? forYouRank(s) : ""
  }
  return [...rows]
    .map((row): DemoRow => ({ ...row, reason: scores.get(row.id as string)?.reason ?? null }))
    .sort((a, b) => key(b).localeCompare(key(a)) || String(b.id).localeCompare(String(a.id)))
}
