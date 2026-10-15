import type { Brief, Idea, IdeaStage, IdeaTemplate } from "../domain"

export const IDEA_COLUMNS =
  "id, space_id, title, stage, tags, template, brief, currency, created_by, created_at, updated_at"

export interface IdeaRow {
  id: string
  space_id: string
  title: string
  stage: IdeaStage
  tags: string[]
  template: IdeaTemplate
  brief: Brief
  currency: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export const toIdea = (row: IdeaRow): Idea => ({
  id: row.id,
  spaceId: row.space_id,
  title: row.title,
  stage: row.stage,
  tags: row.tags,
  template: row.template,
  brief: row.brief,
  currency: row.currency,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})
