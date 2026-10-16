import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { appError } from "@/shared/domain"
import { WatchService } from "../application/watch-service"
import { FakeWatchGateway } from "../testing/fake-watch-gateway"
import { SPACE_ID, item } from "../testing/fixtures"
import { WatchListState } from "./watch-list-state.svelte"

const setup = (count = 0, pageSize = 50) => {
  const gateway = new FakeWatchGateway()
  gateway.items = Array.from({ length: count }, (_, n) => item(n + 1, `Title ${n + 1}`))
  const service = new WatchService(gateway, undefined, pageSize)
  return { gateway, list: new WatchListState(service, () => SPACE_ID, 300) }
}

describe("WatchListState", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }))
  afterEach(() => vi.useRealTimers())

  it("loads 150 titles over three pages without duplicates", async () => {
    const { list } = setup(150)
    await list.load()
    expect(list.items).toHaveLength(50)
    await list.loadMore()
    await list.loadMore()
    expect(list.items).toHaveLength(150)
    await list.loadMore()
    expect(list.items).toHaveLength(150)
    expect(list.next).toBeNull()
    await list.loadMore()
  })

  it("tells an empty list apart from an empty filter result", async () => {
    const { list } = setup()
    await list.load()
    expect(list.empty).toBe(true)
    expect(list.narrowed).toBe(false)
    await list.setFilter({ mediaType: "anime" })
    expect(list.narrowed).toBe(true)
    await list.clearFilters()
    expect(list.filters.mediaType).toBeNull()
  })

  it("debounces search and keeps the latest response only", async () => {
    const { gateway, list } = setup(3)
    await list.load()
    list.search("title 2")
    list.search("title 3")
    expect(gateway.lists).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(300)
    expect(gateway.lists).toHaveLength(2)
    expect(list.items.map((i) => i.title)).toEqual(["Title 3"])
  })

  it("reports load and load-more failures separately", async () => {
    const { gateway, list } = setup(3, 2)
    await list.load()
    gateway.failWith = appError("network", "down")
    await list.loadMore()
    expect(list.moreError?.message).toBe("down")
    expect(list.items).toHaveLength(2)
    await list.load()
    expect(list.status).toBe("error")
    gateway.failWith = null
    await list.load()
    expect(list.status).toBe("ready")
  })

  it("ignores a response that arrives after dispose", async () => {
    const { list } = setup(2)
    const pending = list.load()
    list.dispose()
    await pending
    expect(list.status).toBe("loading")
    const more = setup(3, 2).list
    await more.load()
    const late = more.loadMore()
    more.dispose()
    await late
    expect(more.items).toHaveLength(2)
  })
})
