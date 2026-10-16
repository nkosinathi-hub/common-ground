import { getContext, setContext } from "svelte"
import type { NotificationsService } from "../application/notifications-service"
import type { NotificationsStore } from "./notifications-store.svelte"

export interface NotificationsContext {
  readonly service: NotificationsService
  readonly store: NotificationsStore
}

const KEY = Symbol("notifications")

export function provideNotifications(value: NotificationsContext): void {
  setContext(KEY, value)
}

export function useNotifications(): NotificationsContext {
  const value = getContext<NotificationsContext | undefined>(KEY)
  if (!value)
    throw new Error(
      "Notifications is not provided: call provideNotifications in the composition root",
    )
  return value
}
