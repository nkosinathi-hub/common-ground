import type { Cursor, Page, Result } from "@/shared/domain"
import type { Comment, ParentRef } from "../domain/comment"
import type { EpisodeTag } from "../domain/episodes"

export interface NewComment {
  readonly spaceId: string
  readonly parent: ParentRef
  readonly body: string
  readonly spoiler: boolean
  readonly mentionIds: readonly string[]
  readonly replyTo?: string | null
  /** A title comment's episode; left out, the server uses your place. */
  readonly tag?: EpisodeTag | null
}

/** Which comments a page shows: one episode (a chip), and nothing past your place. */
export interface ThreadFilter {
  readonly episode?: EpisodeTag | null
  /** Hide comments tagged past this place; null hides every tagged one; absent hides none. */
  readonly upTo?: EpisodeTag | null
}

/** A comment kept out of the page, for the notice that says who is ahead. */
export interface HiddenComment {
  readonly authorId: string | null
  readonly tag: EpisodeTag | null
}

/** One page of a thread: newest first, strictly older than `after` when given. */
export interface ThreadPageRequest {
  readonly spaceId: string
  readonly parent: ParentRef
  readonly after: Cursor | null
  readonly filter?: ThreadFilter
  /** Replies to this comment instead of the top of the thread. */
  readonly replyTo?: string
}

export interface CommentsGateway {
  list(request: ThreadPageRequest): Promise<Result<Page<Comment>>>
  post(input: NewComment): Promise<Result<Comment>>
  edit(id: string, body: string, spoiler: boolean): Promise<Result<Comment>>
  remove(id: string): Promise<Result<void>>
  /** Top-level comments past your place, for the spoiler notice. */
  hidden(
    spaceId: string,
    parent: ParentRef,
    upTo: EpisodeTag | null,
  ): Promise<Result<HiddenComment[]>>
  heart(commentId: string, on: boolean): Promise<Result<void>>
}
