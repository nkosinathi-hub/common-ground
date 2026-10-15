import { describe, expect, it } from "vitest"
import { RecommendationsService } from "../application/recommendations-service"
import { FakeRecommendationsGateway } from "../testing/fake-recommendations-gateway"
import { InboxState } from "./inbox.svelte"

const setup = (count: number) => {
  const gateway = new FakeRecommendationsGateway()
  gateway.receive("s", count)
  return { gateway, inbox: new InboxState(new RecommendationsService(gateway, 2), "s") }
}
const ids = (inbox: InboxState) => inbox.items.map((r) => r.id)

describe("InboxState", () => {
  it("loads newest first and appends further pages", async () => {
    const { inbox } = setup(3)
    await inbox.load()
    expect(inbox.status).toBe("ready")
    expect(ids(inbox)).toEqual(["r3", "r2"])
    expect(inbox.hasMore).toBe(true)
    expect((await inbox.loadMore()).ok).toBe(true)
    expect(ids(inbox)).toEqual(["r3", "r2", "r1"])
    expect(inbox.hasMore).toBe(false)
    expect((await inbox.loadMore()).ok).toBe(true)
  })

  it("drops answered recommendations and keeps them when answering fails", async () => {
    const { gateway, inbox } = setup(2)
    await inbox.load()
    expect((await inbox.respond("r2", "acknowledged")).ok).toBe(true)
    expect(ids(inbox)).toEqual(["r1"])
    gateway.failWith = { kind: "denied", message: "No" }
    expect((await inbox.respond("r1", "dismissed")).ok).toBe(false)
    expect(ids(inbox)).toEqual(["r1"])
  })

  it("reports failures to load and to load more", async () => {
    const { gateway, inbox } = setup(3)
    gateway.failWith = { kind: "network", message: "Offline" }
    await inbox.load()
    expect(inbox.status).toBe("error")
    gateway.failWith = null
    await inbox.retry()
    gateway.failWith = { kind: "network", message: "Offline" }
    expect((await inbox.loadMore()).ok).toBe(false)
    expect(inbox.loadingMore).toBe(false)
    expect(ids(inbox)).toEqual(["r3", "r2"])
  })
})
