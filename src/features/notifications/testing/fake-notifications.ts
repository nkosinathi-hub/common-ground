import {
  appError,
  err,
  nextCursor,
  ok,
  PAGE_SIZE,
  type Cursor,
  type Page,
  type Result,
} from "@/shared/domain"
import type { ActivityGateway, NotificationsGateway } from "../application/ports"
import type { ActivityEvent, Notification } from "../domain/notification"

export class FakeNotifications implements NotificationsGateway {
  items: Notification[] = []
  failWrites = false
  listeners = new Set<() => void>()

  /** Newest first after the cursor, one page at a time, like the keyset query. */
  async list(after: Cursor | null = null): Promise<Result<Page<Notification>>> {
    const older = (n: Notification) =>
      !after ||
      n.createdAt < after.createdAt ||
      (n.createdAt === after.createdAt && n.id < after.id)
    const sorted = [...this.items].sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
    )
    const items = sorted.filter(older).slice(0, PAGE_SIZE)
    return ok({ items, next: nextCursor(items) })
  }
  async unreadCount(): Promise<Result<number>> {
    return ok(this.items.filter((n) => !n.readAt).length)
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
  async list(
    _spaceId: string,
    _after: unknown,
    size?: number,
  ): Promise<Result<Page<ActivityEvent>>> {
    return ok({ items: this.events.slice(0, size), next: null })
  }
}
