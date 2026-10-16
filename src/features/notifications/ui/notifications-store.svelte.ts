import { untrack } from "svelte"
import type { Cursor } from "@/shared/domain"
import { PagedList } from "@/shared/ui"
import type { NotificationsService } from "../application/notifications-service"
import { unreadCount, type Notification } from "../domain/notification"

type Events = Pick<Window, "addEventListener" | "removeEventListener">

/**
 * The signed-in user's inbox, paged newest first, with the unread count from the server.
 * Realtime pushes a refresh; focus and reconnect also refresh.
 */
export class NotificationsStore {
  readonly list: PagedList<Notification, Cursor>
  unread = $state(0)
  private stop: (() => void) | null = null

  constructor(private readonly service: NotificationsService) {
    this.list = new PagedList((after) => service.list(after))
  }

  get items(): Notification[] {
    return this.list.items
  }

  /** Why the last load failed; the bell shows it with a retry. */
  get error() {
    return this.list.error
  }

  async refresh(): Promise<void> {
    const [, count] = await Promise.all([this.list.load(), this.service.unreadCount()])
    this.unread = count.ok ? count.value : unreadCount(this.list.items)
  }

  start(target: Events = window): () => void {
    const refresh = () => {
      void this.refresh()
    }
    this.stop = this.service.subscribe(refresh)
    target.addEventListener("focus", refresh)
    target.addEventListener("online", refresh)
    untrack(refresh)
    return () => {
      this.stop?.()
      target.removeEventListener("focus", refresh)
      target.removeEventListener("online", refresh)
      this.list.items = []
      this.list.error = null
      this.unread = 0
    }
  }

  async open(item: Notification): Promise<void> {
    if (item.readAt) return
    const readAt = this.service.readAt()
    this.list.items = this.list.items.map((n) => (n.id === item.id ? { ...n, readAt } : n))
    this.unread = Math.max(0, this.unread - 1)
    const marked = await this.service.markRead([item.id], readAt)
    if (!marked.ok) await this.refresh()
  }

  async markAll(): Promise<void> {
    const [items, unread] = [this.list.items, this.unread]
    const readAt = this.service.readAt()
    this.list.items = this.list.items.map((n) => ({ ...n, readAt: n.readAt ?? readAt }))
    this.unread = 0
    const marked = await this.service.markAllRead(readAt)
    if (!marked.ok) [this.list.items, this.unread] = [items, unread]
  }
}
