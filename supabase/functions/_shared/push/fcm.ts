import type { Fetch } from "./access-token.ts"

/** One push to one device: what it says and the SPA hash route it opens. */
export interface PushMessage {
  readonly token: string
  readonly title: string
  readonly body: string
  readonly route: string
  readonly notificationId: string
}

/** gone: FCM no longer knows the token, so the device row should be forgotten. */
export type SendResult = "sent" | "gone" | "failed"

export type Send = (message: PushMessage) => Promise<SendResult>

/** The FCM HTTP v1 body. Data values are strings; the app reads `route` when it is tapped. */
export const fcmMessage = (m: PushMessage) => ({
  message: {
    token: m.token,
    notification: { title: m.title, body: m.body },
    data: { route: m.route, notificationId: m.notificationId },
  },
})

async function isUnregistered(response: Response): Promise<boolean> {
  if (response.status === 404) return true
  try {
    const body = (await response.json()) as { error?: { details?: { errorCode?: string }[] } }
    return (body.error?.details ?? []).some((detail) => detail.errorCode === "UNREGISTERED")
  } catch {
    return false
  }
}

/** Sends through FCM HTTP v1. Never throws and never logs tokens or message text. */
export function createFcmSender(
  projectId: string,
  accessToken: () => Promise<string>,
  fetchFn: Fetch,
): Send {
  const url = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`

  return async (message) => {
    try {
      const response = await fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await accessToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fcmMessage(message)),
      })
      if (response.ok) return "sent"
      return (await isUnregistered(response)) ? "gone" : "failed"
    } catch {
      return "failed"
    }
  }
}
