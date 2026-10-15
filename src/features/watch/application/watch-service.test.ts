import { describe, expect, it } from "vitest"
import { appError, type DateOnly } from "@/shared/domain"
import { DEFAULT_FILTERS } from "../domain/filters"
import { FakeWatchGateway } from "../testing/fake-watch-gateway"
import { SPACE_ID, item } from "../testing/fixtures"
import { WatchService } from "./watch-service"

const today = "2026-10-15" as DateOnly
const setup = (pageSize = 50) => {
  const gateway = new FakeWatchGateway()
  return { gateway, service: new WatchService(gateway, () => today, pageSize) }
}

describe("WatchService", () => {
  it("pages through 150 titles with a keyset cursor and no repeats", async () => {
    const { gateway, service } = setup()
    gateway.items = Array.from({ length: 150 }, (_, n) => item(n + 1, `Title ${n + 1}`))
    const seen: string[] = []
    let cursor = null
    for (let i = 0; i < 4; i++) {
      const page = await service.list(SPACE_ID, DEFAULT_FILTERS, cursor)
      if (!page.ok) throw new Error("page failed")
      seen.push(...page.value.items.map((x) => x.id))
      cursor = page.value.next
      if (!cursor) break
    }
    expect(seen).toHaveLength(150)
    expect(new Set(seen).size).toBe(150)
    expect(gateway.lists).toHaveLength(3)
    expect(gateway.lists[0]?.size).toBe(50)
  })

  it("normalises the search before asking the gateway", async () => {
    const { gateway, service } = setup()
    await service.list(SPACE_ID, { ...DEFAULT_FILTERS, search: "  DUNE " })
    expect(gateway.lists[0]?.filters.search).toBe("dune")
  })

  it("picks only from the whole watch-together queue across pages", async () => {
    const { gateway, service } = setup(2)
    gateway.items = [1, 2, 3, 4, 5].map((n) => item(n, `T${n}`, { intent: "watch_together" }))
    gateway.items.push(item(6, "Solo"))
    const queue = await service.togetherQueue(SPACE_ID)
    expect(queue.ok && queue.value.map((i) => i.title)).toEqual(["T5", "T4", "T3", "T2", "T1"])
    const pick = await service.pickForUs(SPACE_ID, () => 0)
    expect(pick.ok && pick.value?.title).toBe("T5")
    gateway.failWith = appError("network", "down")
    expect((await service.pickForUs(SPACE_ID)).ok).toBe(false)
  })
})
