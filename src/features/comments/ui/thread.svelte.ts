import { SvelteSet } from "svelte/reactivity"
import { ok, type AppError, type Cursor, type Result } from "@/shared/domain"
import type { CommentsService } from "../application/comments-service"
import type { NewComment } from "../application/ports"
import { isConcealed, type Comment, type ParentRef } from "../domain/comment"

/** What the composer hands over; the thread adds where it belongs. */
export type Draft = Pick<NewComment, "body" | "spoiler" | "mentionIds">

/** One thread: newest page first, shown oldest at the top, with older pages loaded above. */
export class ThreadState {
  items = $state<Comment[]>([])
  status = $state<"loading" | "ready" | "error">("loading")
  error = $state<AppError | null>(null)
  next = $state<Cursor | null>(null)
  loadingOlder = $state(false)
  private readonly revealed = new SvelteSet<string>()

  constructor(
    private readonly service: CommentsService,
    private readonly spaceId: string,
    private readonly parent: ParentRef,
  ) {}

  get hasOlder(): boolean {
    return this.next !== null
  }

  async load(): Promise<void> {
    this.status = "loading"
    const page = await this.service.page(this.spaceId, this.parent, null)
    if (!page.ok) {
      this.error = page.error
      this.status = "error"
      return
    }
    this.items = [...page.value.items].reverse()
    this.next = page.value.next
    this.error = null
    this.status = "ready"
  }

  retry = () => this.load()

  async loadOlder(): Promise<Result<void>> {
    if (!this.next) return ok(undefined)
    this.loadingOlder = true
    const page = await this.service.page(this.spaceId, this.parent, this.next)
    this.loadingOlder = false
    if (!page.ok) return page
    this.items = [...[...page.value.items].reverse(), ...this.items]
    this.next = page.value.next
    return ok(undefined)
  }

  async post(draft: Draft) {
    const posted = await this.service.post({ ...draft, spaceId: this.spaceId, parent: this.parent })
    if (posted.ok) this.items = [...this.items, posted.value]
    return posted
  }

  async edit(id: string, body: string, spoiler: boolean) {
    const edited = await this.service.edit(id, body, spoiler)
    if (edited.ok) {
      const { body: text, spoiler: hidden } = edited.value
      this.items = this.items.map((c) =>
        c.id === id ? { ...c, body: text, spoiler: hidden, edited: true } : c,
      )
    }
    return edited
  }

  async remove(id: string) {
    const removed = await this.service.remove(id)
    if (removed.ok) this.items = this.items.filter((c) => c.id !== id)
    return removed
  }

  concealed = (comment: Comment) => isConcealed(comment, this.revealed)
  reveal = (id: string) => void this.revealed.add(id)
}
