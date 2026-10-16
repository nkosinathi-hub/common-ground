import { describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import { NOW, note, notificationsSetup } from "../testing/notifications-setup"
import { NotificationsStore } from "./notifications-store.svelte"

const events = () => ({ addEventListener: () => {}, removeEventListener: () => {} })

const setup = () => {
  const fakes = notificationsSetup()
  return { ...fakes, store: new NotificationsStore(fakes.service) }
}

describe("NotificationsStore", () => {
  it("loads, receives pushes and counts unread", async () => {
    const { inbox, store } = setup()
    inbox.items = [note("1")]
    const stop = store.start(events())
    await store.refresh()
    expect(store.unread).toBe(1)
    inbox.push(note("2"))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(store.items).toHaveLength(2)
    stop()
    expect(store.items).toEqual([])
  })

  it("marks one or all read at the clock's time, rolling back on failure", async () => {
    const { inbox, store } = setup()
    inbox.items = [note("1"), note("2")]
    await store.refresh()
    await store.open(store.items[0]!)
    expect(store.unread).toBe(1)
    expect(store.items[0]?.readAt).toBe(NOW)
    inbox.failWrites = true
    await store.markAll()
    expect(store.unread).toBe(1)
    inbox.failWrites = false
    await store.markAll()
    expect(store.unread).toBe(0)
  })

  it("keeps the failure for the bell, and clears it once a refresh works", async () => {
    const { inbox, store } = setup()
    const list = inbox.list.bind(inbox)
    inbox.list = async () => err(appError("network", "down"))
    await store.refresh()
    expect(store.error?.kind).toBe("network")
    inbox.list = list
    await store.refresh()
    expect(store.error).toBeNull()
  })
})
