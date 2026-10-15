import type { Cursor } from "@/shared/domain"
import type { Comment, ParentRef } from "../domain/comment"

export const COMMENT_COLUMNS =
  "id, space_id, watch_item_id, idea_id, author_id, body, spoiler, edited, created_at"

export interface CommentRow {
  id: string
  space_id: string
  watch_item_id: string | null
  idea_id: string | null
  author_id: string | null
  body: string
  spoiler: boolean
  edited: boolean
  created_at: string
  comment_mentions?: { user_id: string }[]
}

export const parentColumn = (parent: ParentRef) =>
  parent.kind === "watch" ? "watch_item_id" : "idea_id"

/** PostgREST filter for rows strictly older than the cursor in (created_at, id) order. */
export const olderThan = ({ createdAt, id }: Cursor) =>
  `created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt.${id})`

export function toComment(row: CommentRow, mentionIds?: readonly string[]): Comment {
  return {
    id: row.id,
    createdAt: row.created_at,
    spaceId: row.space_id,
    parent: row.watch_item_id
      ? { kind: "watch", id: row.watch_item_id }
      : { kind: "idea", id: row.idea_id ?? "" },
    authorId: row.author_id,
    body: row.body,
    spoiler: row.spoiler,
    edited: row.edited,
    mentionIds: mentionIds ?? (row.comment_mentions ?? []).map((m) => m.user_id),
  }
}
