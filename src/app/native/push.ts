import { App } from "@capacitor/app"
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
  let saved = false
  let pending: Promise<unknown> = Promise.resolve()
  // Saving the token fails offline; the next resume tries again.
  const save = () => {
    if (token && !saved) pending = devices.register(token).then((result) => (saved = result.ok))
  }
  const registration = await PushNotifications.addListener("registration", ({ value }) => {
    token = value
    saved = false
    save()
  })
  const resume = await App.addListener("resume", save)
  await PushNotifications.register()
  return {
    forget: async () => {
      await Promise.all([registration.remove(), resume.remove()])
      await pending // a save still in flight must not land after the forget
      if (token) await devices.unregister(token)
      await PushNotifications.unregister()
    },
  }
}
