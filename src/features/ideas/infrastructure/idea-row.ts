import type { Tables } from "@/shared/infrastructure/database.types"
import type { Brief, Idea } from "../domain"

export type IdeaRow = Pick<
  Tables<"ideas">,
  | "id"
  | "space_id"
  | "title"
  | "stage"
  | "tags"
  | "template"
  | "brief"
  | "currency"
  | "created_by"
  | "created_at"
  | "updated_at"
>

export const IDEA_COLUMNS =
  "id, space_id, title, stage, tags, template, brief, currency, created_by, created_at, updated_at"

export const toIdea = (row: IdeaRow): Idea => ({
  id: row.id,
  spaceId: row.space_id,
  title: row.title,
  stage: row.stage,
  tags: row.tags,
  template: row.template,
  // jsonb holds what cleanBrief saved: an object of brief fields to text.
  brief: row.brief as Brief,
  currency: row.currency,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})
