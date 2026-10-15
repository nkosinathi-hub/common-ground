import type { Page, Cursor, Result } from "@/shared/domain"
import type { ActivityEvent, Notification } from "../domain/notification"

export interface NotificationsGateway {
  list(after: Cursor | null): Promise<Result<Page<Notification>>>
  /** Stamps the given notifications read at `readAt` (an ISO timestamp). */
  markRead(ids: readonly string[], readAt: string): Promise<Result<void>>
  markAllRead(readAt: string): Promise<Result<void>>
  /** Calls back on any new notification for the signed-in user; returns an unsubscribe. */
  subscribe(onChange: () => void): () => void
}

export interface ActivityGateway {
  list(spaceId: string, after: Cursor | null): Promise<Result<Page<ActivityEvent>>>
}
