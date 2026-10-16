import type { Cursor, Page, Result } from "@/shared/domain"
import type { Comment, ParentRef } from "../domain/comment"

export interface NewComment {
  readonly spaceId: string
  readonly parent: ParentRef
  readonly body: string
  readonly spoiler: boolean
  readonly mentionIds: readonly string[]
}

/** One page of a thread: newest first, strictly older than `after` when given. */
export interface ThreadPageRequest {
  readonly spaceId: string
  readonly parent: ParentRef
  readonly after: Cursor | null
}

export interface CommentsGateway {
  list(request: ThreadPageRequest): Promise<Result<Page<Comment>>>
  post(input: NewComment): Promise<Result<Comment>>
  edit(id: string, body: string, spoiler: boolean): Promise<Result<Comment>>
  remove(id: string): Promise<Result<void>>
}
