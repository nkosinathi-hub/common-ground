/** One device of a notification's recipient, with what the notification is about. */
export interface PushTarget {
  readonly token: string
  readonly spaceId: string
  readonly type: string
  readonly subjectType: string
  readonly subjectId: string
  readonly actorName: string | null
}

/** public.push_targets and public.push_devices through the service-role client. */
export interface PushStore {
  targets(notificationId: string): Promise<readonly PushTarget[]>
  /** Deletes device rows whose tokens FCM reports as unregistered. */
  forget(tokens: readonly string[]): Promise<void>
}
