import type { Database } from "@/shared/infrastructure/database.types"
import type { SearchKind } from "../domain/search"

export interface SearchSource {
  readonly table: keyof Database["public"]["Tables"]
  readonly kind: SearchKind
  readonly fields: readonly string[]
  readonly columns: string
}
export const SOURCES: readonly SearchSource[] = [
  {
    table: "watch_items",
    kind: "watch",
    fields: ["title", "synopsis"],
    columns: "id,title,synopsis,catalog_type,catalog_id",
  },
  { table: "ideas", kind: "idea", fields: ["title"], columns: "id,title" },
  { table: "space_notes", kind: "note", fields: ["body"], columns: "id,body" },
  {
    table: "calendar_events",
    kind: "event",
    fields: ["title", "description", "location"],
    columns: "id,title,description",
  },
  {
    table: "tasks",
    kind: "task",
    fields: ["title", "description"],
    columns: "id,title,description,idea_id",
  },
  { table: "milestones", kind: "milestone", fields: ["title"], columns: "id,title,idea_id" },
  { table: "idea_notes", kind: "research", fields: ["body"], columns: "id,body,idea_id" },
  {
    table: "research_links",
    kind: "research",
    fields: ["title", "description", "url"],
    columns: "id,title,description,idea_id",
  },
  { table: "hypotheses", kind: "research", fields: ["statement"], columns: "id,statement,idea_id" },
  {
    table: "comments",
    kind: "discussion",
    fields: ["body"],
    columns:
      "id,body,idea_id,watch_item_id,spoiler,season,episode,watch_items(watch_progress(user_id,season,episode))",
  },
  {
    table: "attachments",
    kind: "attachment",
    fields: ["filename"],
    columns: "id,filename,idea_id",
  },
]
/** PostgREST wildcard and quoted-logic escaping are separate: user text never becomes syntax. */
export const pattern = (text: string) => `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
export const quoted = (text: string) => `"${text.replace(/[\\"]/g, (c) => `\\${c}`)}"`
