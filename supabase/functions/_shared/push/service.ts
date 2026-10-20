import { pushCopy, pushRoute } from "./copy.ts"
import type { Send } from "./fcm.ts"
import type { PushStore, PushTarget } from "./ports.ts"

export interface Delivery {
  readonly sent: number
  readonly removed: number
  readonly failed: number
}

const messageFor = (notificationId: string, t: PushTarget) => ({
  ...pushCopy(t.type, t.actorName),
  token: t.token,
  route: pushRoute(t.spaceId, t.subjectType, t.subjectId, t.type),
  notificationId,
})

/** Sends one notification to each of its recipient's devices and forgets the gone ones. */
export async function deliver(
  store: PushStore,
  send: Send,
  notificationId: string,
): Promise<Delivery> {
  const targets = await store.targets(notificationId)
  const results = await Promise.all(targets.map((t) => send(messageFor(notificationId, t))))
  const gone = targets.filter((_, i) => results[i] === "gone").map((t) => t.token)
  if (gone.length > 0) await store.forget(gone)
  return {
    sent: results.filter((r) => r === "sent").length,
    removed: gone.length,
    failed: results.filter((r) => r === "failed").length,
  }
}
