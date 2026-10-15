import { describe, expect, it } from "vitest"
import type { Notification } from "../domain/notification"
import { FakeNotifications } from "../testing/fake-notifications"
import { NotificationsStore } from "./notifications.svelte"

const note = (id: string): Notification => ({
  id,
  spaceId: "s",
  type: "mention",
  subjectType: "idea",
  subjectId: "i",
  actorName: "Ana",
  readAt: null,
  createdAt: "2026-10-15T10:00:00Z",
})
const events = () => ({ addEventListener: () => {}, removeEventListener: () => {} })

describe("NotificationsStore", () => {
  it("loads, receives pushes and counts unread", async () => {
    const gateway = new FakeNotifications()
    gateway.items = [note("1")]
    const store = new NotificationsStore(gateway)
    const stop = store.start(events())
    await store.refresh()
    expect(store.unread).toBe(1)
    gateway.push(note("2"))
    await new Promise((r) => setTimeout(r, 0))
    expect(store.items).toHaveLength(2)
    stop()
    expect(store.items).toEqual([])
  })

  it("marks one or all read, rolling back on failure", async () => {
    const gateway = new FakeNotifications()
    gateway.items = [note("1"), note("2")]
    const store = new NotificationsStore(gateway)
    await store.refresh()
    await store.open(store.items[0]!)
    expect(store.unread).toBe(1)
    gateway.failWrites = true
    await store.markAll()
    expect(store.unread).toBe(1)
    gateway.failWrites = false
    await store.markAll()
    expect(store.unread).toBe(0)
  })
})
