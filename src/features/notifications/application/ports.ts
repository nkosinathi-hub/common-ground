import type { Page, Cursor, Result } from "@/shared/domain"
import type { ActivityEvent, Notification } from "../domain/notification"

export interface NotificationsGateway {
  list(after: Cursor | null): Promise<Result<Page<Notification>>>
  markRead(ids: readonly string[]): Promise<Result<void>>
  markAllRead(): Promise<Result<void>>
  /** Calls back on any new notification for the signed-in user; returns an unsubscribe. */
  subscribe(onChange: () => void): () => void
}

export interface ActivityGateway {
  list(spaceId: string, after: Cursor | null): Promise<Result<Page<ActivityEvent>>>
}
