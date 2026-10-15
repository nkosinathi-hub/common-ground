import type { SupabaseClient } from "@supabase/supabase-js"
import { err, ok, type Cursor, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import type { Db } from "@/shared/infrastructure/supabase"
import type { CommentsGateway, NewComment } from "../application/ports"
import type { Comment, ParentRef } from "../domain/comment"
import { COMMENT_COLUMNS, olderThan, parentColumn, toComment, type CommentRow } from "./comment-row"

type Reply<T> = { data: T | null; error: { code?: string; message?: string } | null }

const rowOf = (reply: Reply<CommentRow>, mentionIds?: readonly string[]): Result<Comment> =>
  reply.error || !reply.data ? err(toAppError(reply.error)) : ok(toComment(reply.data, mentionIds))

/** Reads through RLS; every write goes through the comment RPCs. */
export class SupabaseCommentsGateway implements CommentsGateway {
  private readonly db: SupabaseClient

  // The comments tables arrive in the generated types once the watch and ideas migrations land.
  constructor(db: Db) {
    this.db = db as unknown as SupabaseClient
  }

  async list(
    spaceId: string,
    parent: ParentRef,
    before: Cursor | null,
    size: number,
  ): Promise<Result<Comment[]>> {
    let query = this.db
      .from("comments")
      .select(`${COMMENT_COLUMNS}, comment_mentions(user_id)`)
      .eq("space_id", spaceId)
      .eq(parentColumn(parent), parent.id)
    if (before) query = query.or(olderThan(before))
    const reply: Reply<CommentRow[]> = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(size)
    return reply.error
      ? err(toAppError(reply.error))
      : ok((reply.data ?? []).map((r) => toComment(r)))
  }

  async post(input: NewComment): Promise<Result<Comment>> {
    const reply: Reply<CommentRow> = await this.db.rpc("post_comment", {
      target_space: input.spaceId,
      parent_kind: input.parent.kind,
      parent_id: input.parent.id,
      body: input.body,
      spoiler: input.spoiler,
      mention_ids: input.mentionIds,
    })
    return rowOf(reply, input.mentionIds)
  }

  async edit(id: string, body: string, spoiler: boolean): Promise<Result<Comment>> {
    const reply: Reply<CommentRow> = await this.db.rpc("edit_comment", {
      target: id,
      new_body: body,
      new_spoiler: spoiler,
    })
    return rowOf(reply, [])
  }

  async remove(id: string): Promise<Result<void>> {
    const { error } = await this.db.rpc("delete_comment", { target: id })
    return error ? err(toAppError(error)) : ok(undefined)
  }
}
