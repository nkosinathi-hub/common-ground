import type { Cursor, Page, Result } from "@/shared/domain"
import type { ActivityEvent, Notification } from "../domain/notification"
import type { ActivityGateway, NotificationsGateway } from "./ports"

/** The signed-in user's inbox and each space's activity log. Read times come from the clock. */
export class NotificationsService {
  constructor(
    private readonly inbox: NotificationsGateway,
    private readonly activity: ActivityGateway,
    private readonly clock: () => Date,
  ) {}

  /** Now, as the ISO timestamp a notification is marked read at. */
  readAt(): string {
    return this.clock().toISOString()
  }

  list(after: Cursor | null = null): Promise<Result<Page<Notification>>> {
    return this.inbox.list(after)
  }

  markRead(ids: readonly string[], readAt = this.readAt()): Promise<Result<void>> {
    return this.inbox.markRead(ids, readAt)
  }

  markAllRead(readAt = this.readAt()): Promise<Result<void>> {
    return this.inbox.markAllRead(readAt)
  }

  subscribe(onChange: () => void): () => void {
    return this.inbox.subscribe(onChange)
  }

  activityIn(
    spaceId: string,
    after: Cursor | null = null,
    size?: number,
  ): Promise<Result<Page<ActivityEvent>>> {
    return this.activity.list(spaceId, after, size)
  }
}
