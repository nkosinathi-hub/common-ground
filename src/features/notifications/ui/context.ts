import { getContext, setContext } from "svelte"
import type { ActivityGateway } from "../application/ports"
import type { NotificationsStore } from "./notifications.svelte"

const KEY = Symbol("notifications")

export interface NotificationsContext {
  readonly store: NotificationsStore
  readonly activity: ActivityGateway
}

export const provideNotifications = (value: NotificationsContext) => setContext(KEY, value)
export const useNotifications = (): NotificationsContext => getContext<NotificationsContext>(KEY)
