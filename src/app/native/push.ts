import { PushNotifications } from "@capacitor/push-notifications"
import type { PushDevicesGateway } from "@/features/notifications"

/** The notification channel FCM posts to (AndroidManifest.xml names it the default). */
const CHANNEL = "updates"

export interface PhonePush {
  /** Sign-out: the server stops pushing to this phone. Runs while the session still exists. */
  forget(): Promise<void>
}

const NONE: PhonePush = { forget: () => Promise.resolve() }

async function allowed(): Promise<boolean> {
  let { receive } = await PushNotifications.checkPermissions()
  if (receive === "prompt" || receive === "prompt-with-rationale")
    ({ receive } = await PushNotifications.requestPermissions())
  return receive === "granted"
}

/** After sign-in: ask once, register with FCM, and keep the token against the user. */
export async function startPush(devices: PushDevicesGateway): Promise<PhonePush> {
  if (!(await allowed())) return NONE
  await PushNotifications.createChannel({
    id: CHANNEL,
    name: "Notes and updates",
    description: "Notes, recommendations, reminders and invites from your spaces",
    importance: 4,
  })
  let token: string | null = null
  const listener = await PushNotifications.addListener("registration", ({ value }) => {
    token = value
    void devices.register(value)
  })
  await PushNotifications.register()
  return {
    forget: async () => {
      await listener.remove()
      if (token) await devices.unregister(token)
      await PushNotifications.unregister()
    },
  }
}
