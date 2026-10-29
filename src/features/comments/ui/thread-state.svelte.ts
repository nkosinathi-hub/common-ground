import { SvelteSet } from "svelte/reactivity"
import type { Cursor } from "@/shared/domain"
import { PagedList } from "@/shared/ui"
import type { CommentsService } from "../application/comments-service"
import type { HiddenComment, NewComment, ThreadFilter } from "../application/ports"
import { isConcealed, withEdit, type Comment, type ParentRef } from "../domain/comment"
import { placeOf, type EpisodeContext } from "../domain/episodes"
import { ThreadReplies } from "./thread-replies.svelte"

const NONE: EpisodeContext = { place: null, episodeCount: 0 }

/** What the composer hands over; the thread adds where it belongs. */
export type Draft = Pick<NewComment, "body" | "spoiler" | "mentionIds">

/**
 * One thread: pages newest first, shown oldest at the top. On a series it filters by episode
 * (the chips) and keeps comments past your place out until you choose Show, for this visit only.
 */
export class ThreadState {
  readonly list: PagedList<Comment, Cursor>
  readonly items = $derived.by(() => [...this.list.items].reverse())
  readonly replies: ThreadReplies
  /** The episode chip, in your season; null is All. */
  chip = $state<number | null>(null)
  showAhead = $state(false)
  hidden = $state<HiddenComment[]>([])
  private readonly revealed = new SvelteSet<string>()

  constructor(
    private readonly service: CommentsService,
    private readonly spaceId: string,
    private readonly parent: ParentRef,
    private readonly episodes: () => EpisodeContext | null = () => null,
  ) {
    this.list = new PagedList((after) => service.page(spaceId, parent, after, this.filter()))
    this.replies = new ThreadReplies(service, spaceId, parent)
    this.chip = placeOf(episodes() ?? NONE)?.episode ?? null
  }

  private get season() {
    return placeOf(this.episodes() ?? NONE)?.season ?? 1
  }

  private filter(): ThreadFilter | undefined {
    const context = this.episodes()
    if (!context) return undefined
    const episode = this.chip === null ? null : { season: this.season, episode: this.chip }
    return this.showAhead ? { episode } : { episode, upTo: placeOf(context) }
  }

  load = async (): Promise<void> => {
    const context = this.episodes()
    const hidden =
      context && !this.showAhead
        ? this.service.hidden(this.spaceId, this.parent, placeOf(context))
        : null
    await this.list.load()
    const found = hidden ? await hidden : null
    this.hidden = found?.ok ? found.value : []
  }

  choose = (episode: number | null) => ((this.chip = episode), void this.load())
  show = () => ((this.showAhead = true), void this.load())

  async post(draft: Draft, replyTo?: Comment) {
    const tag = this.chip === null ? undefined : { season: this.season, episode: this.chip }
    const input = { ...draft, spaceId: this.spaceId, parent: this.parent }
    const posted = this.service.post({ ...input, replyTo: replyTo?.id ?? null, tag })
    if (replyTo) return this.replies.added(replyTo, posted)
    await this.list.add(posted)
    return posted
  }

  /** Hearts a comment or a reply, or takes the heart back. */
  async heart(comment: Comment) {
    const change = await this.replies.heart(comment)
    if (change) this.list.items = this.list.items.map((c) => (c.id === comment.id ? change(c) : c))
  }

  /** The edit RPC returns no mentions, so the comment keeps the ones it has. */
  async edit(id: string, body: string, spoiler: boolean) {
    const edited = this.service.edit(id, body, spoiler)
    await this.list.apply(edited, (next, items) =>
      items.map((c) => (c.id === id ? withEdit(c, next) : c)),
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
