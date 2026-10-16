import { describe, expect, it } from "vitest"
import { RecommendationsService } from "../application/recommendations-service"
import { FakeRecommendationsGateway } from "../testing/fake-recommendations-gateway"
import { InboxState } from "./inbox-state.svelte"

const setup = (count: number) => {
  const gateway = new FakeRecommendationsGateway(2)
  gateway.receive("s", count)
  return { gateway, inbox: new InboxState(new RecommendationsService(gateway), "s") }
}
const ids = (inbox: InboxState) => inbox.list.items.map((r) => r.id)

describe("InboxState", () => {
  it("loads newest first and appends further pages once each", async () => {
    const { inbox } = setup(3)
    await inbox.load()
    expect(inbox.list.loading).toBe(false)
    expect(ids(inbox)).toEqual(["r3", "r2"])
    expect(inbox.list.hasMore).toBe(true)
    await Promise.all([inbox.list.loadMore(), inbox.list.loadMore()])
    expect(ids(inbox)).toEqual(["r3", "r2", "r1"])
    expect(inbox.list.hasMore).toBe(false)
  })

  it("drops answered recommendations and keeps them when answering fails", async () => {
    const { gateway, inbox } = setup(2)
    await inbox.load()
    expect(await inbox.respond("r2", "acknowledged")).toBeNull()
    expect(ids(inbox)).toEqual(["r1"])
    gateway.failWith = { kind: "denied", message: "No" }
    expect(await inbox.respond("r1", "dismissed")).toMatchObject({ kind: "denied" })
    expect(ids(inbox)).toEqual(["r1"])
  })

  it("reports failures to load and to load more", async () => {
    const { gateway, inbox } = setup(3)
    gateway.failWith = { kind: "network", message: "Offline" }
    await inbox.load()
    expect(inbox.list.error?.kind).toBe("network")
    gateway.failWith = null
    await inbox.load()
    gateway.failWith = { kind: "network", message: "Offline" }
    await inbox.list.loadMore()
    expect(inbox.list.loadingMore).toBe(false)
    expect(inbox.list.error?.kind).toBe("network")
    expect(ids(inbox)).toEqual(["r3", "r2"])
  })
})
