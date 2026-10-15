import type { Tables } from "@/shared/infrastructure/database.types"
import type { Comment, ParentRef } from "../domain/comment"

export type CommentRow = Pick<
  Tables<"comments">,
  | "id"
  | "space_id"
  | "watch_item_id"
  | "idea_id"
  | "author_id"
  | "body"
  | "spoiler"
  | "edited"
  | "created_at"
> & { readonly comment_mentions?: readonly { readonly user_id: string }[] }

export const COMMENT_COLUMNS =
  "id, space_id, watch_item_id, idea_id, author_id, body, spoiler, edited, created_at"

export const parentColumn = (parent: ParentRef) =>
  parent.kind === "watch" ? "watch_item_id" : "idea_id"

/** RPC replies carry no mentions, so the caller passes the ones it already knows. */
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
