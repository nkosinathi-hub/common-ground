import type { Cursor, Result } from "@/shared/domain"
import type { Comment, ParentRef } from "../domain/comment"

export interface NewComment {
  readonly spaceId: string
  readonly parent: ParentRef
  readonly body: string
  readonly spoiler: boolean
  readonly mentionIds: readonly string[]
}

export interface CommentsGateway {
  /** Newest first, strictly older than `before` when given. */
  list(
    spaceId: string,
    parent: ParentRef,
    before: Cursor | null,
    size: number,
  ): Promise<Result<Comment[]>>
  post(input: NewComment): Promise<Result<Comment>>
  edit(id: string, body: string, spoiler: boolean): Promise<Result<Comment>>
  remove(id: string): Promise<Result<void>>
}
