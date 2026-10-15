import type { AppError } from "@/shared/domain"
import type { NotificationsGateway } from "../application/ports"
import { isoNow, unreadCount, type Notification } from "../domain/notification"

/** The signed-in user's inbox. Realtime pushes a refresh; focus and reconnect also refresh. */
export class NotificationsStore {
  items = $state<Notification[]>([])
  error = $state<AppError | null>(null)
  unread = $derived(unreadCount(this.items))
  private stop: (() => void) | null = null

  constructor(private readonly gateway: NotificationsGateway) {}

  async refresh(): Promise<void> {
    const page = await this.gateway.list(null)
    if (page.ok) {
      this.items = [...page.value.items]
      this.error = null
    } else this.error = page.error
  }

  start(target: Pick<Window, "addEventListener" | "removeEventListener"> = window): () => void {
    const refresh = () => void this.refresh()
    this.stop = this.gateway.subscribe(refresh)
    target.addEventListener("focus", refresh)
    target.addEventListener("online", refresh)
    void this.refresh()
    return () => {
      this.stop?.()
      target.removeEventListener("focus", refresh)
      target.removeEventListener("online", refresh)
      this.items = []
    }
  }

  async open(item: Notification): Promise<void> {
    if (item.readAt) return
    this.items = this.items.map((n) => (n.id === item.id ? { ...n, readAt: isoNow() } : n))
    const done = await this.gateway.markRead([item.id])
    if (!done.ok) await this.refresh()
  }

  async markAll(): Promise<void> {
    const before = this.items
    const now = isoNow()
    this.items = this.items.map((n) => ({ ...n, readAt: n.readAt ?? now }))
    const done = await this.gateway.markAllRead()
    if (!done.ok) this.items = before
  }
}
