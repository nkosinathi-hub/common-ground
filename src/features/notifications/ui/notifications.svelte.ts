import { untrack } from "svelte"
import type { AppError } from "@/shared/domain"
import type { NotificationsService } from "../application/notifications-service"
import { unreadCount, type Notification } from "../domain/notification"

type Events = Pick<Window, "addEventListener" | "removeEventListener">

/** The signed-in user's inbox. Realtime pushes a refresh; focus and reconnect also refresh. */
export class NotificationsStore {
  items = $state<Notification[]>([])
  /** Why the last refresh failed; the bell shows it with a retry. */
  error = $state<AppError | null>(null)
  unread = $derived(unreadCount(this.items))
  private stop: (() => void) | null = null

  constructor(private readonly service: NotificationsService) {}

  async refresh(): Promise<void> {
    const page = await this.service.list()
    if (!page.ok) {
      this.error = page.error
      return
    }
    this.items = [...page.value.items]
    this.error = null
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
      this.items = []
      this.error = null
    }
  }

  async open(item: Notification): Promise<void> {
    if (item.readAt) return
    const readAt = this.service.readAt()
    this.items = this.items.map((n) => (n.id === item.id ? { ...n, readAt } : n))
    const marked = await this.service.markRead([item.id], readAt)
    if (!marked.ok) await this.refresh()
  }

  async markAll(): Promise<void> {
    const before = this.items
    const readAt = this.service.readAt()
    this.items = this.items.map((n) => ({ ...n, readAt: n.readAt ?? readAt }))
    const marked = await this.service.markAllRead(readAt)
    if (!marked.ok) this.items = before
  }
}
