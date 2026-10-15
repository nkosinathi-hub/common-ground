import { appError, err, nextCursor, ok, type Page, type Result } from "@/shared/domain"
import type { ActivityGateway, NotificationsGateway } from "../application/ports"
import type { ActivityEvent, Notification } from "../domain/notification"

export class FakeNotifications implements NotificationsGateway {
  items: Notification[] = []
  failWrites = false
  listeners = new Set<() => void>()

  async list(): Promise<Result<Page<Notification>>> {
    return ok({ items: [...this.items], next: nextCursor(this.items) })
  }
  async markRead(ids: readonly string[], readAt: string) {
    if (this.failWrites) return err(appError("network", "down"))
    this.items = this.items.map((n) => (ids.includes(n.id) ? { ...n, readAt } : n))
    return ok(undefined)
  }
  async markAllRead(readAt: string) {
    return this.markRead(
      this.items.map((n) => n.id),
      readAt,
    )
  }
  subscribe(onChange: () => void) {
    this.listeners.add(onChange)
    return () => {
      this.listeners.delete(onChange)
    }
  }
  push(n: Notification) {
    this.items = [n, ...this.items]
    for (const listener of this.listeners) listener()
  }
}

export class FakeActivity implements ActivityGateway {
  events: ActivityEvent[] = []
  async list(): Promise<Result<Page<ActivityEvent>>> {
    return ok({ items: [...this.events], next: null })
  }
}
