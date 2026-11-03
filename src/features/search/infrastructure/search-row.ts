import type { Route } from "@/shared/domain"
import type { SearchHit, SearchKind } from "../domain/search"

export const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {}
const text = (value: unknown) => (typeof value === "string" ? value : "")
function routeOf(kind: SearchKind, row: Record<string, unknown>, spaceId: string): Route | null {
  const id = text(row.id),
    ideaId = text(row.idea_id)
  if (!id) return null
  if (kind === "watch") return { name: "watch-item", spaceId, itemId: id }
  if (kind === "idea") return { name: "idea", spaceId, ideaId: id, tab: "overview" }
  if (kind === "note") return { name: "note", spaceId, noteId: id }
  if (kind === "event") return { name: "event", spaceId, eventId: id }
  if (kind === "discussion" && row.watch_item_id)
    return { name: "watch-item", spaceId, itemId: text(row.watch_item_id), tab: "discussion" }
  if (!ideaId) return null
  const tab =
    kind === "task"
      ? "tasks"
      : kind === "milestone"
        ? "milestones"
        : kind === "discussion"
          ? "discussion"
          : kind === "attachment"
            ? "overview"
            : "research"
  return { name: "idea", spaceId, ideaId, tab }
}
/** Tagged discussion words stay hidden past the viewer's own place, just as in a thread. */
export function safeComment(row: Record<string, unknown>, me: string): boolean {
  if (row.spoiler === true) return false
  if (row.season == null) return row.episode == null
  const progress = record(row.watch_items).watch_progress
  const own = Array.isArray(progress) ? progress.map(record).find((p) => p.user_id === me) : null
  if (typeof own?.season !== "number" || typeof own.episode !== "number") return false
  return (
    typeof row.season === "number" &&
    typeof row.episode === "number" &&
    (row.season < own.season || (row.season === own.season && row.episode <= own.episode))
  )
}
export function toHit(value: unknown, kind: SearchKind, spaceId: string): SearchHit[] {
  const row = record(value),
    route = routeOf(kind, row, spaceId)
  if (!route) return []
  const body = text(row.body) || text(row.statement)
  const title = text(row.title) || text(row.filename) || body.slice(0, 90)
  const catalog =
    (row.catalog_type === "movie" || row.catalog_type === "tv") &&
    typeof row.catalog_id === "number"
      ? ({ type: row.catalog_type, id: row.catalog_id } as const)
      : undefined
  return [
    {
      id: text(row.id),
      kind,
      title,
      route,
      catalog,
      preview: (text(row.description) || text(row.synopsis) || body).slice(0, 180),
    },
  ]
}
