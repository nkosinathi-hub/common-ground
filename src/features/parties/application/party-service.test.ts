import { describe, expect, it } from "vitest"
import { FakePartyGateway, ITEM } from "../testing/fake-party-gateway"
import { PartyService } from "./party-service"

const ep = (season: number, episode: number) => ({ season, episode })
const setup = () => {
  const gateway = new FakePartyGateway("ana")
  return { gateway, service: new PartyService(gateway) }
}

describe("PartyService", () => {
  it("starts a party for a valid range", async () => {
    const { gateway, service } = setup()
    const range = { from: ep(1, 3), to: ep(1, 4) }
    expect(await service.start({ watchItemId: ITEM, source: "jellyfin", range })).toEqual({
      ok: true,
      value: "party-1",
    })
    expect(gateway.calls[0]).toEqual(["start", { watchItemId: ITEM, source: "jellyfin", range }])
  })

  it("refuses a backwards range before calling the server", async () => {
    const { gateway, service } = setup()
    const range = { from: ep(1, 4), to: ep(1, 3) }
    const result = await service.start({ watchItemId: ITEM, source: "external", range })
    expect(result).toMatchObject({ ok: false, error: { kind: "validation", field: "range" } })
    expect(gateway.calls).toEqual([])
  })

  it("starts a film party without a range", async () => {
    const { service } = setup()
    expect((await service.start({ watchItemId: ITEM, source: "external", range: null })).ok).toBe(
      true,
    )
  })

  it("passes membership calls through", async () => {
    const { gateway, service } = setup()
    const id = (await service.start({ watchItemId: ITEM, source: "external", range: null })) as {
      value: string
    }
    for (const call of ["join", "confirm", "handover", "finish", "cancel", "get"] as const)
      await service[call](id.value)
    expect(gateway.calls.slice(1).map(([name]) => name)).toEqual([
      "join",
      "confirm",
      "handover",
      "finish",
      "cancel",
      "get",
    ])
    expect((await service.openFor(ITEM)).ok).toBe(true)
  })
})

describe("PartyService default range", () => {
  it("defaults to the episode after the together pointer", async () => {
    const { gateway, service } = setup()
    gateway.togetherAt = { at: ep(2, 3) }
    expect(await service.defaultRange(ITEM)).toEqual({ from: ep(2, 4), to: ep(2, 4) })
  })

  it("starts at the beginning when nothing was watched together", async () => {
    const { service } = setup()
    expect(await service.defaultRange(ITEM)).toEqual({ from: ep(1, 1), to: ep(1, 1) })
  })

  it("starts at the beginning when the together pointer cannot be read", async () => {
    const { gateway, service } = setup()
    gateway.failNext = { ok: false, error: { kind: "network", message: "offline" } }
    expect(await service.defaultRange(ITEM)).toEqual({ from: ep(1, 1), to: ep(1, 1) })
  })
})
