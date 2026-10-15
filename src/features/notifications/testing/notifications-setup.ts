import { NotificationsService } from "../application/notifications-service"
import type { Notification } from "../domain/notification"
import { FakeActivity, FakeNotifications } from "./fake-notifications"

export const NOW = "2026-10-15T12:00:00.000Z"

export const note = (id: string, extra: Partial<Notification> = {}): Notification => ({
  id,
  spaceId: "s",
  type: "mention",
  subjectType: "idea",
  subjectId: "i",
  actorName: "Ana",
  readAt: null,
  createdAt: "2026-10-15T10:00:00Z",
  ...extra,
})

/** A NotificationsService over in-memory fakes and a clock stopped at NOW. */
export function notificationsSetup() {
  const inbox = new FakeNotifications()
  const activity = new FakeActivity()
  const service = new NotificationsService(inbox, activity, () => new Date(NOW))
  return { inbox, activity, service }
}
