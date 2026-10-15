import type { Result } from "@/shared/domain"
import { olderThan } from "@/shared/infrastructure/paging"
import { done, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { CommentsGateway, NewComment, ThreadPageRequest } from "../application/ports"
import type { Comment } from "../domain/comment"
import { COMMENT_COLUMNS, parentColumn, toComment } from "./comment-row"

/** Reads through RLS; every write goes through the comment RPCs. */
export class SupabaseCommentsGateway implements CommentsGateway {
  constructor(private readonly db: Db) {}

  list({ spaceId, parent, after, size }: ThreadPageRequest): Promise<Result<Comment[]>> {
    let query = this.db
      .from("comments")
      .select(`${COMMENT_COLUMNS}, comment_mentions(user_id)`)
      .eq("space_id", spaceId)
      .eq(parentColumn(parent), parent.id)
    if (after) query = query.or(olderThan(after))
    const page = query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(size)
    return settle(page, (rows) => rows.map((row) => toComment(row)))
  }

  post(input: NewComment): Promise<Result<Comment>> {
    const reply = this.db.rpc("post_comment", {
      target_space: input.spaceId,
      parent_kind: input.parent.kind,
      parent_id: input.parent.id,
      body: input.body,
      spoiler: input.spoiler,
      mention_ids: [...input.mentionIds],
    })
    return settle(reply, (row) => toComment(row, input.mentionIds))
  }

  edit(id: string, body: string, spoiler: boolean): Promise<Result<Comment>> {
    const reply = this.db.rpc("edit_comment", { target: id, new_body: body, new_spoiler: spoiler })
    return settle(reply, (row) => toComment(row, []))
  }

  remove(id: string): Promise<Result<void>> {
    return done(this.db.rpc("delete_comment", { target: id }))
  }
}
