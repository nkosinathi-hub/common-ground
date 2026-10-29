import type { Cursor, Page, Result } from "@/shared/domain"
import { validateBody, type Comment, type ParentRef } from "../domain/comment"
import type { EpisodeTag } from "../domain/episodes"
import type { CommentsGateway, NewComment, ThreadFilter } from "./ports"

export class CommentsService {
  constructor(private readonly gateway: CommentsGateway) {}

  page(
    spaceId: string,
    parent: ParentRef,
    after: Cursor | null,
    filter?: ThreadFilter,
    replyTo?: string,
  ): Promise<Result<Page<Comment>>> {
    return this.gateway.list({ spaceId, parent, after, filter, replyTo })
  }

  hidden = (spaceId: string, parent: ParentRef, upTo: EpisodeTag | null) =>
    this.gateway.hidden(spaceId, parent, upTo)

  heart = (commentId: string, on: boolean) => this.gateway.heart(commentId, on)

  async post(input: NewComment): Promise<Result<Comment>> {
    const body = validateBody(input.body)
    if (!body.ok) return body
    const mentionIds = [...new Set(input.mentionIds)]
    return this.gateway.post({ ...input, body: body.value, mentionIds })
  }

  async edit(id: string, body: string, spoiler: boolean): Promise<Result<Comment>> {
    const valid = validateBody(body)
    return valid.ok ? this.gateway.edit(id, valid.value, spoiler) : valid
  }

  remove = (id: string) => this.gateway.remove(id)
}
