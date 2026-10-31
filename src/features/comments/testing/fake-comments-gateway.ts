import { appError, err, nextCursor, ok, PAGE_SIZE, type AppError } from "@/shared/domain"
import type { CommentsGateway, NewComment, ThreadPageRequest } from "../application/ports"
import type { Comment, ParentRef } from "../domain/comment"
import { isAhead, type EpisodeTag } from "../domain/episodes"
import { fresh, sameParent, selected, START, threadOf } from "./comment-rows"

/** In-memory comments with the same ordering and permission rules as the database. */
export class FakeCommentsGateway implements CommentsGateway {
  rows: Comment[] = []
  calls: string[] = []
  failWith: AppError | null = null
  me = "me"
  /** Who hearted each comment. */
  readonly hearts = new Map<string, Set<string>>()
  private seq = 0

  constructor(private readonly pageSize = PAGE_SIZE) {}

  private nextId() {
    this.seq += 1
    return { id: `c${this.seq}`, createdAt: new Date(START + this.seq * 1000).toISOString() }
  }

  seed(
    spaceId: string,
    parent: ParentRef,
    count: number,
    authorId = "someone",
    extra: Partial<Comment> = {},
  ) {
    for (let i = 0; i < count; i += 1) {
      const base = { ...this.nextId(), spaceId, parent, authorId, body: `Comment ${this.seq}` }
      this.rows.push(fresh({ ...base, spoiler: false, edited: false, mentionIds: [], ...extra }))
    }
  }

  /** Hearts and reply counts are read at query time, as the page query embeds them. */
  private view = (c: Comment): Comment => {
    const by = this.hearts.get(c.id) ?? new Set()
    const replies = this.rows.filter((r) => r.replyTo === c.id).length
    return { ...c, hearts: by.size, hearted: by.has(this.me), replies }
  }

  async list(request: ThreadPageRequest) {
    if (this.failWith) return err(this.failWith)
    const items = selected(this.rows, request).slice(0, this.pageSize).map(this.view)
    return ok({ items, next: nextCursor(items, this.pageSize) })
  }

  async hidden(spaceId: string, parent: ParentRef, upTo: EpisodeTag | null) {
    const rows = this.rows.filter(
      (c) => c.spaceId === spaceId && sameParent(c.parent, parent) && c.replyTo === null,
    )
    return ok(
      rows.filter((c) => isAhead(c.tag, upTo)).map((c) => ({ authorId: c.authorId, tag: c.tag })),
    )
  }

  async heart(commentId: string, on: boolean) {
    const by = this.hearts.get(commentId) ?? new Set<string>()
    if (on) by.add(this.me)
    else by.delete(this.me)
    this.hearts.set(commentId, by)
    return ok(undefined)
  }

  async post(input: NewComment) {
    this.calls.push("post")
    if (this.failWith) return err(this.failWith)
    const comment = fresh({
      ...input,
      ...this.nextId(),
      authorId: this.me,
      edited: false,
      ...threadOf(this.rows, input),
    })
    this.rows.push(comment)
    return ok(comment)
  }

  async edit(id: string, body: string, spoiler: boolean) {
    this.calls.push(`edit:${id}`)
    if (this.failWith) return err(this.failWith)
    const index = this.rows.findIndex((c) => c.id === id)
    const found = this.rows[index]
    if (!found) return err(appError("denied", "You can only edit your own comments"))
    const changed = { ...found, body, spoiler, edited: true, mentionIds: [] }
    this.rows[index] = changed
    return ok(changed)
  }

  async remove(id: string) {
    this.calls.push(`remove:${id}`)
    if (this.failWith) return err(this.failWith)
    this.rows = this.rows.filter((c) => c.id !== id && c.replyTo !== id)
    return ok(undefined)
  }
}
