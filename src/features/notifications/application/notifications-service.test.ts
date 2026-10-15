import { describe, expect, it } from "vitest"
import { NOW, note, notificationsSetup } from "../testing/notifications-setup"

describe("NotificationsService", () => {
  it("stamps reads with the injected clock", async () => {
    const { inbox, service } = notificationsSetup()
    inbox.items = [note("1"), note("2")]
    expect(service.readAt()).toBe(NOW)
    await service.markRead(["1"])
    expect(inbox.items.map((n) => n.readAt)).toEqual([NOW, null])
    await service.markAllRead("2026-10-16T00:00:00.000Z")
    expect(inbox.items[1]?.readAt).toBe("2026-10-16T00:00:00.000Z")
  })

  it("lists the inbox and a space's activity, and relays pushes", async () => {
    const { inbox, activity, service } = notificationsSetup()
    inbox.items = [note("1")]
    activity.events = [
      {
        id: "e1",
        eventType: "member_joined",
        subjectType: "profile",
        subjectId: "u",
        actorName: null,
        createdAt: "2026-10-15T09:00:00Z",
      },
    ]
    expect((await service.list()).ok).toBe(true)
    const events = await service.activityIn("s")
    expect(events.ok && events.value.items.map((e) => e.id)).toEqual(["e1"])
    let pushes = 0
    const stop = service.subscribe(() => pushes++)
    inbox.push(note("2"))
    stop()
    inbox.push(note("3"))
    expect(pushes).toBe(1)
  })
})
