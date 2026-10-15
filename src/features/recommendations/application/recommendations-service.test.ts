import { describe, expect, it } from "vitest"
import { FakeRecommendationsGateway } from "../testing/fake-recommendations-gateway"
import { RecommendationsService } from "./recommendations-service"

const setup = () => {
  const gateway = new FakeRecommendationsGateway()
  return { gateway, service: new RecommendationsService(gateway, 2) }
}

describe("RecommendationsService", () => {
  it("validates recipients and the note before sending", async () => {
    const { gateway, service } = setup()
    expect((await service.send("w1", ["me"], "", "me")).ok).toBe(false)
    expect((await service.send("w1", ["z"], "n".repeat(501), "me")).ok).toBe(false)
    expect(gateway.calls).toEqual([])
    expect((await service.send("w1", ["z", "a", "z"], "  ", "me")).ok).toBe(true)
    expect(gateway.sent).toEqual([
      { itemId: "w1", recipientId: "z", note: null },
      { itemId: "w1", recipientId: "a", note: null },
    ])
  })

  it("surfaces the duplicate pending rule", async () => {
    const { service } = setup()
    await service.send("w1", ["z"], "Go", "me")
    expect(await service.send("w1", ["z"], "Again", "me")).toMatchObject({
      ok: false,
      error: { kind: "validation" },
    })
  })

  it("pages the inbox newest first and responds", async () => {
    const { gateway, service } = setup()
    gateway.receive("s", 3)
    const first = await service.inbox("s", null)
    if (!first.ok) throw new Error("expected a page")
    expect(first.value.items.map((r) => r.id)).toEqual(["r3", "r2"])
    const second = await service.inbox("s", first.value.next)
    expect(second).toMatchObject({ ok: true, value: { items: [{ id: "r1" }], next: null } })
    expect((await service.respond("r1", "dismissed")).ok).toBe(true)
    expect(gateway.calls).toEqual(["dismissed:r1"])
  })

  it("passes inbox failures through", async () => {
    const { gateway, service } = setup()
    gateway.failWith = { kind: "network", message: "Offline" }
    expect((await service.inbox("s", null)).ok).toBe(false)
  })
})
