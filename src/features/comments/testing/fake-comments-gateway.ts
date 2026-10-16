import {
  appError,
  err,
  nextCursor,
  ok,
  PAGE_SIZE,
  type AppError,
  type Cursor,
} from "@/shared/domain"
import type { CommentsGateway, NewComment, ThreadPageRequest } from "../application/ports"
import type { Comment, ParentRef } from "../domain/comment"

const START = Date.parse("2026-10-15T10:00:00.000Z")
const newestFirst = (a: Comment, b: Comment) =>
  b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
const olderThan = (c: Comment, cursor: Cursor) =>
  c.createdAt < cursor.createdAt || (c.createdAt === cursor.createdAt && c.id < cursor.id)
const sameParent = (a: ParentRef, b: ParentRef) => a.kind === b.kind && a.id === b.id

/** In-memory comments with the same ordering and permission rules as the database. */
export class FakeCommentsGateway implements CommentsGateway {
  rows: Comment[] = []
  calls: string[] = []
  failWith: AppError | null = null
  me = "me"
  private seq = 0

  constructor(private readonly pageSize = PAGE_SIZE) {}

  private nextId() {
    this.seq += 1
    return { id: `c${this.seq}`, createdAt: new Date(START + this.seq * 1000).toISOString() }
  }

  seed(spaceId: string, parent: ParentRef, count: number, authorId = "someone") {
    for (let i = 0; i < count; i += 1) {
      const { id, createdAt } = this.nextId()
      this.rows.push({
        id,
        createdAt,
        spaceId,
        parent,
        authorId,
        body: `Comment ${this.seq}`,
        spoiler: false,
        edited: false,
        mentionIds: [],
      })
    }
  }

  async list({ spaceId, parent, after }: ThreadPageRequest) {
    if (this.failWith) return err(this.failWith)
    const rows = this.rows
      .filter((c) => c.spaceId === spaceId && sameParent(c.parent, parent))
      .filter((c) => !after || olderThan(c, after))
      .sort(newestFirst)
    const items = rows.slice(0, this.pageSize)
    return ok({ items, next: nextCursor(items, this.pageSize) })
  }

  async post(input: NewComment) {
    this.calls.push("post")
    if (this.failWith) return err(this.failWith)
    const comment: Comment = { ...input, ...this.nextId(), authorId: this.me, edited: false }
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
    this.rows = this.rows.filter((c) => c.id !== id)
    return ok(undefined)
  }
}
