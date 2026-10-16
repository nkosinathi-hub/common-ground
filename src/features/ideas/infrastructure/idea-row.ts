import type { Tables } from "@/shared/infrastructure/database.types"
import type { Brief, Collaborator, Idea } from "../domain"

export type CollaboratorRow = Pick<
  Tables<"idea_collaborators">,
  "user_id" | "invited_by" | "invited_at" | "accepted_at"
>

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
> & { readonly idea_collaborators: CollaboratorRow[] }

export const COLLABORATOR_COLUMNS = "user_id, invited_by, invited_at, accepted_at"

export const IDEA_COLUMNS =
  "id, space_id, title, stage, tags, template, brief, currency, created_by, created_at, updated_at, idea_collaborators(user_id, invited_by, invited_at, accepted_at)"

export const toCollaborator = (row: CollaboratorRow): Collaborator => ({
  userId: row.user_id,
  invitedBy: row.invited_by,
  invitedAt: row.invited_at,
  acceptedAt: row.accepted_at,
})

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
  collaborators: row.idea_collaborators.map(toCollaborator),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})
