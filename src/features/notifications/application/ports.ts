import type { Page, Cursor, Result } from "@/shared/domain"
import type { ActivityEvent, Notification } from "../domain/notification"

export interface NotificationsGateway {
  list(after: Cursor | null): Promise<Result<Page<Notification>>>
  /** Every unread notification of the signed-in user, not only the loaded page. */
  unreadCount(): Promise<Result<number>>
  /** Stamps the given notifications read at `readAt` (an ISO timestamp). */
  markRead(ids: readonly string[], readAt: string): Promise<Result<void>>
  markAllRead(readAt: string): Promise<Result<void>>
  /** Calls back on any new notification for the signed-in user; returns an unsubscribe. */
  subscribe(onChange: () => void): () => void
}

export interface ActivityGateway {
  /** Newest first; `size` asks for fewer than a full page. */
  list(spaceId: string, after: Cursor | null, size?: number): Promise<Result<Page<ActivityEvent>>>
}

/** Phones that receive push for the signed-in user (the Android app only). */
export interface PushDevicesGateway {
  register(token: string): Promise<Result<void>>
  unregister(token: string): Promise<Result<void>>
}
