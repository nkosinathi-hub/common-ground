import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { FakeMemberDirectory } from "@/shared/domain/testing/fake-members"
import { PartyService } from "../application/party-service"
import { FakePartyGateway, partyOf } from "../testing/fake-party-gateway"
import { FakePartyHub } from "../testing/fake-party-hub"
import { PartyRoomState } from "./party-room-state.svelte"

beforeEach(() => void vi.useFakeTimers().setSystemTime(1_000_000))
afterEach(() => vi.useRealTimers())

function room(status: "planned" | "ended" = "planned") {
  const gateway = new FakePartyGateway("guest")
  gateway.parties.set("p1", partyOf("p1", "host", { status }))
  const hub = new FakePartyHub()
  const context = {
    service: new PartyService(gateway),
    channel: hub,
    members: new FakeMemberDirectory([]),
    clock: { now: () => Date.now() },
    player: () => null,
  }
  return { gateway, hub, state: new PartyRoomState(context, "p1", "guest") }
}

describe("PartyRoomState", () => {
  it("joins an open party and connects to its channel", async () => {
    const { gateway, hub, state } = room()
    await state.open()
    expect(gateway.calls.map(([name]) => name)).toEqual(["get", "join", "get"])
    expect(state.party?.members.map((m) => m.userId)).toEqual(["host", "guest"])
    expect(hub.topics).toEqual(["party:p1"])
    expect(state.view?.isHost).toBe(false)
    state.close()
  })

  it("only shows a party that has finished", async () => {
    const { gateway, hub, state } = room("ended")
    await state.open()
    expect(gateway.calls.map(([name]) => name)).toEqual(["get"])
    expect(state.party?.status).toBe("ended")
    expect(hub.topics).toEqual([])
    expect(state.view).toBeNull()
  })

  it("reports a party it cannot open", async () => {
    const { gateway, state } = room()
    gateway.parties.clear()
    await state.open()
    expect(state.error?.kind).toBe("not_found")
  })

  it("confirms on Ready and reloads the party after finishing or cancelling", async () => {
    const { gateway, state } = room()
    await state.open()
    await state.ready()
    expect(gateway.calls.at(-1)).toEqual(["confirm", "p1"])
    expect(state.view?.ready).toBe(true)
    await state.finish()
    expect(state.party?.status).toBe("ended")
    gateway.parties.set("p1", partyOf("p1", "guest"))
    await state.cancel()
    expect(state.party?.status).toBe("cancelled")
  })

  it("lets a guest move nothing before the host starts", async () => {
    const { hub, state } = room()
    await state.open()
    state.pause()
    state.play()
    state.seek(10)
    state.countdown()
    expect(hub.sent.filter((m) => m.kind === "command")).toEqual([])
    expect(state.view?.state.phase).toBe("lobby")
    state.close()
  })
})
