import { SvelteMap } from "svelte/reactivity"
import type { Result } from "@/shared/domain"
import type { CommentsService } from "../application/comments-service"
import type { Comment, ParentRef } from "../domain/comment"

/** The replies under each comment, loaded when someone opens them. */
export class ThreadReplies {
  readonly open = new SvelteMap<string, Comment[]>()

  constructor(
    private readonly service: CommentsService,
    private readonly spaceId: string,
    private readonly parent: ParentRef,
  ) {}

  async toggle(id: string): Promise<void> {
    if (this.open.has(id)) return void this.open.delete(id)
    const page = await this.service.page(this.spaceId, this.parent, null, undefined, id)
    if (page.ok) this.open.set(id, [...page.value.items].reverse())
  }

  /** A reply joins the thread of the comment it answers, shown under it. */
  async added(to: Comment, posted: Promise<Result<Comment>>): Promise<Result<Comment>> {
    const done = await posted
    const root = to.replyTo ?? to.id
    if (done.ok) this.open.set(root, [...(this.open.get(root) ?? []), done.value])
    return done
  }

  /** Saves a heart and applies it to any open reply; hands back the change for the page. */
  async heart(comment: Comment): Promise<((c: Comment) => Comment) | null> {
    const on = !comment.hearted
    if (!(await this.service.heart(comment.id, on)).ok) return null
    const change = (c: Comment) => ({ ...c, hearted: on, hearts: c.hearts + (on ? 1 : -1) })
    for (const [root, list] of this.open)
      if (list.some((c) => c.id === comment.id))
        this.open.set(
          root,
          list.map((c) => (c.id === comment.id ? change(c) : c)),
        )
    return change
  }
}
