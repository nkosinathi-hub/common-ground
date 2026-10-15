export type { ActivityGateway, NotificationsGateway } from "./application/ports"
export {
  describeActivity,
  describeNotification,
  subjectHref,
  type ActivityEvent,
  type Notification,
} from "./domain/notification"
export { provideNotifications, useNotifications } from "./ui/context"
export { NotificationsStore } from "./ui/notifications.svelte"
export { default as NotificationsBell } from "./ui/NotificationsBell.svelte"
export { default as ActivityFeed } from "./ui/ActivityFeed.svelte"
