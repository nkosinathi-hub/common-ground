import { describe, expect, it } from "vitest"
import { PAGE_SIZE } from "@/shared/domain"
import { note, notificationsSetup } from "../testing/notifications-setup"
import { NotificationsStore } from "./notifications-store.svelte"

const many = (count: number) =>
  Array.from({ length: count }, (_, n) => {
    const createdAt = new Date(Date.parse("2026-10-15T10:00:00Z") - n * 1000).toISOString()
    return note(String(1000 + n), { createdAt })
  })

describe("NotificationsStore paging", () => {
  it("counts unread on the server, beyond the loaded page, and pages older ones once", async () => {
    const { inbox, service } = notificationsSetup()
    inbox.items = many(PAGE_SIZE + 10)
    const store = new NotificationsStore(service)
    await store.refresh()
    expect(store.items).toHaveLength(PAGE_SIZE)
    expect(store.unread).toBe(PAGE_SIZE + 10)
    await Promise.all([store.list.loadMore(), store.list.loadMore()])
    expect(store.items).toHaveLength(PAGE_SIZE + 10)
    expect(store.list.hasMore).toBe(false)
  })

  it("lowers the count when one is opened and clears it when all are marked", async () => {
    const { inbox, service } = notificationsSetup()
    inbox.items = many(PAGE_SIZE + 1)
    const store = new NotificationsStore(service)
    await store.refresh()
    await store.open(store.items[0]!)
    expect(store.unread).toBe(PAGE_SIZE)
    await store.markAll()
    expect(store.unread).toBe(0)
  })
})
