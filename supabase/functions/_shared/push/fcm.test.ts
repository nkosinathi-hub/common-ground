import { describe, expect, it, vi } from "vitest"
import { createFcmSender, fcmMessage, type PushMessage } from "./fcm.ts"

const MESSAGE: PushMessage = {
  token: "device-token-0001",
  title: "Ideas",
  body: "Ana mentioned you",
  route: "#/s/space/ideas/idea/discussion",
  notificationId: "1c9d2f6e-6a43-4c8e-9f0a-3d2b1c4e5f61",
}
const URL = "https://fcm.googleapis.com/v1/projects/cg-test/messages:send"
const fcmError = (status: number, errorCode: string) =>
  new Response(
    JSON.stringify({
      error: { status: "X", details: [{ "@type": "type.googleapis.com/x", errorCode }] },
    }),
    { status },
  )

function setup(response: () => Promise<Response>) {
  const fetchFn = vi.fn(async (_url: string, _init: RequestInit) => response())
  const send = createFcmSender("cg-test", async () => "ya29.token", fetchFn)
  return { fetchFn, send }
}

describe("fcmMessage", () => {
  it("builds an HTTP v1 notification with the route as data", () => {
    expect(fcmMessage(MESSAGE)).toEqual({
      message: {
        token: "device-token-0001",
        notification: { title: "Ideas", body: "Ana mentioned you" },
        data: { route: MESSAGE.route, notificationId: MESSAGE.notificationId },
      },
    })
  })
})

describe("createFcmSender", () => {
  it("posts to the project's send endpoint with the access token", async () => {
    const { fetchFn, send } = setup(async () => new Response('{"name":"projects/x/messages/1"}'))
    expect(await send(MESSAGE)).toBe("sent")
    const [url, init] = fetchFn.mock.calls[0]!
    expect(url).toBe(URL)
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer ya29.token")
    expect(JSON.parse(init.body as string)).toEqual(fcmMessage(MESSAGE))
  })

  it("reports a token FCM no longer knows as gone", async () => {
    expect(await setup(async () => fcmError(404, "UNREGISTERED")).send(MESSAGE)).toBe("gone")
    expect(await setup(async () => new Response("", { status: 404 })).send(MESSAGE)).toBe("gone")
    expect(await setup(async () => fcmError(400, "UNREGISTERED")).send(MESSAGE)).toBe("gone")
  })

  it("reports other refusals and outages as failed, never throwing", async () => {
    expect(await setup(async () => fcmError(400, "INVALID_ARGUMENT")).send(MESSAGE)).toBe("failed")
    expect(await setup(async () => new Response("down", { status: 503 })).send(MESSAGE)).toBe(
      "failed",
    )
    expect(await setup(() => Promise.reject(new Error("offline"))).send(MESSAGE)).toBe("failed")
    const noToken = createFcmSender("cg-test", () => Promise.reject(new Error("x")), vi.fn())
    expect(await noToken(MESSAGE)).toBe("failed")
  })
})
