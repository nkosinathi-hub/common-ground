import { SvelteSet } from "svelte/reactivity"
import type { Cursor } from "@/shared/domain"
import { PagedList } from "@/shared/ui"
import type { CommentsService } from "../application/comments-service"
import type { NewComment } from "../application/ports"
import { isConcealed, type Comment, type ParentRef } from "../domain/comment"

/** What the composer hands over; the thread adds where it belongs. */
export type Draft = Pick<NewComment, "body" | "spoiler" | "mentionIds">

/** One thread: pages newest first, shown oldest at the top, with older pages loaded above. */
export class ThreadState {
  readonly list: PagedList<Comment, Cursor>
  readonly items = $derived.by(() => [...this.list.items].reverse())
  private readonly revealed = new SvelteSet<string>()

  constructor(
    private readonly service: CommentsService,
    private readonly spaceId: string,
    private readonly parent: ParentRef,
  ) {
    this.list = new PagedList((after) => service.page(spaceId, parent, after))
  }

  load = () => this.list.load()

  async post(draft: Draft) {
    const posted = this.service.post({ ...draft, spaceId: this.spaceId, parent: this.parent })
    await this.list.add(posted)
    return posted
  }

  /** The edit RPC returns no mentions, so the comment keeps the ones it has. */
  async edit(id: string, body: string, spoiler: boolean) {
    const edited = this.service.edit(id, body, spoiler)
    await this.list.apply(edited, (next, items) =>
      items.map((c) =>
        c.id === id ? { ...c, body: next.body, spoiler: next.spoiler, edited: true } : c,
      ),
    )
    return edited
  }

  async remove(id: string) {
    const removed = this.service.remove(id)
    await this.list.remove(id, removed)
    return removed
  }

  concealed = (comment: Comment) => isConcealed(comment, this.revealed)
  reveal = (id: string) => void this.revealed.add(id)
}
