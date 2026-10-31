import type { Page, Result } from "@/shared/domain"
import { newestFirst, pageOf } from "@/shared/infrastructure/paging"
import { done, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { CommentsGateway, NewComment, ThreadPageRequest } from "../application/ports"
import type { Comment, ParentRef } from "../domain/comment"
import type { EpisodeTag } from "../domain/episodes"
import { COMMENT_COLUMNS, parentColumn, THREAD_COLUMNS, toComment } from "./comment-row"
import { filtered, pastPlace } from "./thread-filter"

/** Reads through RLS; comment writes go through the RPCs, hearts straight to their table. */
export class SupabaseCommentsGateway implements CommentsGateway {
  constructor(private readonly db: Db) {}

  private async me(): Promise<string | undefined> {
    return (await this.db.auth.getUser()).data.user?.id
  }

  async list(request: ThreadPageRequest): Promise<Result<Page<Comment>>> {
    const { spaceId, parent, after, filter, replyTo } = request
    const base = this.db
      .from("comments")
      .select(THREAD_COLUMNS)
      .eq("space_id", spaceId)
      .eq(parentColumn(parent), parent.id)
    const scoped = replyTo ? base.eq("reply_to", replyTo) : base.is("reply_to", null)
    const me = await this.me()
    return settle(
      newestFirst(filtered(scoped, filter), after),
      pageOf((row) => toComment(row, undefined, me)),
    )
  }

  hidden(spaceId: string, parent: ParentRef, upTo: EpisodeTag | null) {
    const query = this.db
      .from("comments")
      .select(COMMENT_COLUMNS)
      .eq("space_id", spaceId)
      .eq(parentColumn(parent), parent.id)
      .is("reply_to", null)
      .or(pastPlace(upTo))
    return settle(query, (rows) => rows.map((row) => toComment(row)))
  }

  heart(commentId: string, on: boolean): Promise<Result<void>> {
    const table = this.db.from("comment_reactions")
    return done(
      on ? table.insert({ comment_id: commentId }) : table.delete().eq("comment_id", commentId),
    )
  }

  async post(input: NewComment): Promise<Result<Comment>> {
    const reply = this.db.rpc("post_comment", {
      target_space: input.spaceId,
      parent_kind: input.parent.kind,
      parent_id: input.parent.id,
      body: input.body,
      spoiler: input.spoiler,
      mention_ids: [...input.mentionIds],
      in_reply_to: input.replyTo ?? undefined,
      tag_season: input.tag?.season,
      tag_episode: input.tag?.episode,
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
