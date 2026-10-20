import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SYNC } from "../domain/sync-constants"
import { partyRoom } from "../testing/session-setup"

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(1_000_000)
})
afterEach(() => vi.useRealTimers())

async function playing() {
  const room = partyRoom({ host: 0, guest: -400, late: 2500 })
  const host = room.member("host")
  const guest = room.member("guest")
  await host.session.ready()
  await guest.session.ready()
  vi.advanceTimersByTime(3 * SYNC.stateIntervalMs)
  host.session.play()
  vi.advanceTimersByTime(5000)
  return { ...room, host, guest }
}

describe("PartySession buffering", () => {
  it("holds everyone while one member buffers, then the host resumes them together", async () => {
    const { host, guest } = await playing()
    guest.player.buffer(true)
    expect(host.session.view.state.phase).toBe("waiting")
    expect(host.player.playing).toBe(false)
    const held = host.player.currentTime()
    guest.player.buffer(false)
    expect(host.session.view.state.phase).toBe("playing")
    vi.advanceTimersByTime(SYNC.scheduleLeadMs)
    expect([host.player.playing, guest.player.playing]).toEqual([true, true])
    expect(guest.player.currentTime()).toBeCloseTo(held, 1)
  })
})

describe("PartySession late joiners and reconnects", () => {
  it("gives a late joiner the party where it is", async () => {
    const { host, member } = await playing()
    const late = member("late")
    vi.advanceTimersByTime(3 * SYNC.stateIntervalMs)
    expect(late.session.view.state.phase).toBe("playing")
    expect(late.player.playing).toBe(true)
    expect(late.player.currentTime()).toBeCloseTo(host.player.currentTime(), 1)
  })

  it("asks the host for the state again after a dropped link", async () => {
    const { hub, guest } = await playing()
    hub.drop(1)
    expect(guest.session.view.connected).toBe(false)
    hub.restore(1)
    expect(guest.session.view.connected).toBe(true)
    expect(hub.sent.at(-2)).toMatchObject({ kind: "snapshot-request", from: "guest" })
    expect(hub.sent.at(-1)).toMatchObject({ kind: "state", from: "host" })
  })

  it("hands the party to the earliest-joined member when the host is gone", async () => {
    const { host, guest, service } = await playing()
    host.session.close()
    vi.advanceTimersByTime(SYNC.hostAbsentMs - SYNC.stateIntervalMs)
    expect(guest.session.isHost).toBe(false)
    vi.advanceTimersByTime(2 * SYNC.stateIntervalMs)
    expect(guest.session.isHost).toBe(true)
    expect(service.calls).toContainEqual(["handover", "p1"])
    guest.session.pause()
    expect(guest.session.view.state.phase).toBe("paused")
  })

  it("tells listeners about every change until they unsubscribe", async () => {
    const { host } = await playing()
    const seen: string[] = []
    const stop = host.session.subscribe((view) => seen.push(view.state.phase))
    host.session.pause()
    stop()
    host.session.play()
    expect(seen).toEqual(["playing", "paused"])
  })
})
