import { describe, expect, it } from "vitest"
import type { PushMessage, SendResult } from "./fcm.ts"
import { createPushHandler } from "./handler.ts"
import type { PushStore, PushTarget } from "./ports.ts"

const SECRET = "p".repeat(48)
const ID = "1c9d2f6e-6a43-4c8e-9f0a-3d2b1c4e5f61"
const SPACE = "0b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f60"
const target = (token: string): PushTarget => ({
  token,
  spaceId: SPACE,
  type: "mention",
  subjectType: "idea",
  subjectId: ID,
  actorName: "Ana",
})

function setup(results: Record<string, SendResult>, configured = true) {
  const sent: PushMessage[] = []
  const forgotten: string[] = []
  const store: PushStore = {
    targets: async (id) => (id === ID ? Object.keys(results).map(target) : []),
    forget: async (tokens) => void forgotten.push(...tokens),
  }
  const send = async (message: PushMessage) => (sent.push(message), results[message.token]!)
  const handle = createPushHandler({ pushSecret: SECRET, store, send: configured ? send : null })
  type Init = { secret?: string; origin?: string }
  const call = (body: unknown, init: Init = {}) =>
    handle(
      new Request("http://fn.test/push", {
        method: "POST",
        headers: {
          ...(init.origin ? { origin: init.origin } : {}),
          "x-push-secret": init.secret ?? SECRET,
        },
        body: JSON.stringify(body),
      }),
    )
  return { call, sent, forgotten }
}

describe("push handler", () => {
  it("sends the notification to every device and forgets the gone ones", async () => {
    const { call, sent, forgotten } = setup({ "tok-a": "sent", "tok-b": "gone", "tok-c": "failed" })
    const response = await call({ notificationId: ID })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ sent: 1, removed: 1, failed: 1 })
    expect(forgotten).toEqual(["tok-b"])
    expect(sent[0]).toEqual({
      token: "tok-a",
      title: "Ideas",
      body: "Ana mentioned you",
      route: `#/s/${SPACE}/ideas/${ID}/discussion`,
      notificationId: ID,
    })
  })

  it("does nothing for a notification without devices", async () => {
    const { call, forgotten } = setup({})
    expect(await (await call({ notificationId: ID })).json()).toEqual({
      sent: 0,
      removed: 0,
      failed: 0,
    })
    expect(forgotten).toEqual([])
  })

  it("refuses a wrong secret, a browser origin and a malformed body", async () => {
    const { call, sent } = setup({ "tok-a": "sent" })
    expect((await call({ notificationId: ID }, { secret: "x".repeat(48) })).status).toBe(403)
    expect((await call({ notificationId: ID }, { origin: "https://evil.example" })).status).toBe(
      403,
    )
    expect((await call({ notificationId: "../x" })).status).toBe(400)
    expect(sent).toEqual([])
  })

  it("answers unavailable while FCM is not configured", async () => {
    expect((await setup({ "tok-a": "sent" }, false).call({ notificationId: ID })).status).toBe(503)
  })
})
