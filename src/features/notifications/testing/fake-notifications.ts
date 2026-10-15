import { appError, err, nextCursor, ok } from "@/shared/domain"
import type { ActivityGateway, NotificationsGateway } from "../application/ports"
import type { ActivityEvent, Notification } from "../domain/notification"

export class FakeNotifications implements NotificationsGateway {
  items: Notification[] = []
  failWrites = false
  listeners = new Set<() => void>()

  async list() {
    return ok({ items: [...this.items], next: nextCursor(this.items) })
  }
  async markRead(ids: readonly string[]) {
    if (this.failWrites) return err(appError("network", "down"))
    this.items = this.items.map((n) => (ids.includes(n.id) ? { ...n, readAt: "now" } : n))
    return ok(undefined)
  }
  async markAllRead() {
    return this.markRead(this.items.map((n) => n.id))
  }
  subscribe(onChange: () => void) {
    this.listeners.add(onChange)
    return () => void this.listeners.delete(onChange)
  }
  push(n: Notification) {
    this.items = [n, ...this.items]
    for (const l of this.listeners) l()
  }
}

export class FakeActivity implements ActivityGateway {
  events: ActivityEvent[] = []
  async list() {
    return ok({ items: [...this.events], next: null })
  }
}
