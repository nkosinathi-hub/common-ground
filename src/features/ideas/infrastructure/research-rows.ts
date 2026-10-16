import { nextCursor, type Page } from "@/shared/domain"
import type { Tables } from "@/shared/infrastructure/database.types"
import type { Hypothesis, IdeaNote, ResearchLink } from "../domain"

type NoteRow = Pick<Tables<"idea_notes">, "id" | "idea_id" | "body" | "created_by" | "created_at">
type LinkRow = Pick<
  Tables<"research_links">,
  "id" | "idea_id" | "url" | "title" | "description" | "created_by" | "created_at"
>
type HypothesisRow = Pick<
  Tables<"hypotheses">,
  "id" | "idea_id" | "statement" | "status" | "created_by" | "created_at"
>

export const NOTE_COLUMNS = "id, idea_id, body, created_by, created_at"
export const LINK_COLUMNS = "id, idea_id, url, title, description, created_by, created_at"
export const HYPOTHESIS_COLUMNS = "id, idea_id, statement, status, created_by, created_at"

export const toNote = (row: NoteRow): IdeaNote => ({
  id: row.id,
  ideaId: row.idea_id,
  body: row.body,
  createdBy: row.created_by,
  createdAt: row.created_at,
})

export const toLink = (row: LinkRow): ResearchLink => ({
  id: row.id,
  ideaId: row.idea_id,
  url: row.url,
  title: row.title,
  description: row.description,
  createdBy: row.created_by,
  createdAt: row.created_at,
})

export const toHypothesis = (row: HypothesisRow): Hypothesis => ({
  id: row.id,
  ideaId: row.idea_id,
  statement: row.statement,
  status: row.status,
  createdBy: row.created_by,
  createdAt: row.created_at,
})

/** Maps a page of rows; a full page carries the cursor for the next one. */
export const pageOf =
  <R, T extends { id: string; createdAt: string }>(map: (row: R) => T) =>
  (rows: R[]): Page<T> => {
    const items = rows.map(map)
    return { items, next: nextCursor(items) }
  }
