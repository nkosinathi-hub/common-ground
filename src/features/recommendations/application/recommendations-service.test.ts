import { describe, expect, it } from "vitest"
import { NOTE_MAX } from "../domain/recommendation"
import { FakeRecommendationsGateway } from "../testing/fake-recommendations-gateway"
import { RecommendationsService } from "./recommendations-service"

const setup = () => {
  const gateway = new FakeRecommendationsGateway(2)
  return { gateway, service: new RecommendationsService(gateway) }
}
const send = (recipientIds: string[], note: string) => ({
  itemId: "w1",
  recipientIds,
  note,
  me: "me",
})

describe("RecommendationsService", () => {
  it("validates recipients and the note before sending", async () => {
    const { gateway, service } = setup()
    expect((await service.send(send(["me"], ""))).ok).toBe(false)
    expect((await service.send(send(["z"], "n".repeat(NOTE_MAX + 1)))).ok).toBe(false)
    expect(gateway.calls).toEqual([])
    expect((await service.send(send(["z", "a", "z"], "  "))).ok).toBe(true)
    expect(gateway.sent).toEqual([
      { itemId: "w1", recipientId: "z", note: null },
      { itemId: "w1", recipientId: "a", note: null },
    ])
  })

  it("surfaces the duplicate pending rule", async () => {
    const { service } = setup()
    await service.send(send(["z"], "Go"))
    expect(await service.send(send(["z"], "Again"))).toMatchObject({
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
