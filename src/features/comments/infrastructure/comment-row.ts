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
> &
  Partial<Pick<Tables<"comments">, "reply_to" | "season" | "episode">> & {
    readonly comment_mentions?: readonly { readonly user_id: string }[]
    readonly comment_reactions?: readonly { readonly user_id: string }[]
    readonly replies?: readonly { readonly count: number }[]
  }

export const COMMENT_COLUMNS =
  "id, space_id, watch_item_id, idea_id, author_id, body, spoiler, edited, created_at, reply_to, season, episode"

/** The page query adds mentions, hearts and how many replies each comment has. */
export const THREAD_COLUMNS = `${COMMENT_COLUMNS}, comment_mentions(user_id), comment_reactions(user_id), replies:comments!reply_to(count)`

export const parentColumn = (parent: ParentRef) =>
  parent.kind === "watch" ? "watch_item_id" : "idea_id"

/** RPC replies carry no mentions, so the caller passes the ones it already knows. */
export function toComment(row: CommentRow, mentionIds?: readonly string[], me?: string): Comment {
  const hearts = row.comment_reactions ?? []
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
    replyTo: row.reply_to ?? null,
    tag:
      row.season != null && row.episode != null
        ? { season: row.season, episode: row.episode }
        : null,
    hearts: hearts.length,
    hearted: me !== undefined && hearts.some((h) => h.user_id === me),
    replies: row.replies?.[0]?.count ?? 0,
  }
}
