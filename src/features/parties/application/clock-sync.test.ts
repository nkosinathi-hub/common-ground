import { describe, expect, it } from "vitest"
import { SYNC } from "../domain/sync-constants"
import { ClockSync } from "./clock-sync"

/** A local clock running `offset` ms from a shared base the test moves. */
function clockAt(offset: number) {
  const base = { t: 1_000_000 }
  return { base, clock: { now: () => base.t + offset } }
}

describe("ClockSync", () => {
  it("is the local clock for the reference member", () => {
    const { clock } = clockAt(42)
    expect(new ClockSync(clock, () => true).now()).toBe(1_000_042)
  })

  it("learns the reference clock from ping and pong", () => {
    const host = clockAt(500)
    const guest = clockAt(0)
    guest.base.t = host.base.t
    const hostSync = new ClockSync(host.clock, () => true)
    const guestSync = new ClockSync(guest.clock, () => false)
    expect(guestSync.now()).toBe(1_000_000)
    const ping = guestSync.ping("guest")
    host.base.t += 20
    guest.base.t += 20
    const pong = hostSync.answer(ping, "host")
    host.base.t += 20
    guest.base.t += 20
    guestSync.record(pong)
    expect(guestSync.estimate).toEqual({ offsetMs: 500, rttMs: 40 })
    expect(guestSync.now()).toBe(host.clock.now())
    expect(guestSync.rttMs).toBe(40)
  })

  it("answers a ping to its sender with the ping's own send time", () => {
    const sync = new ClockSync(clockAt(0).clock, () => true)
    const pong = sync.answer({ kind: "ping", from: "guest", id: "p9", sentAt: 7 }, "host")
    expect(pong).toMatchObject({ kind: "pong", from: "host", to: "guest", id: "p9", sentAt: 7 })
  })

  it("keeps only the latest samples, and forgets them all when the reference changes", () => {
    const { clock } = clockAt(0)
    const sync = new ClockSync(clock, () => false)
    for (let i = 0; i < SYNC.pingSamples + 3; i++) {
      const ping = sync.ping("guest")
      sync.record({ ...sync.answer(ping, "host"), kind: "pong" })
    }
    expect(sync.sampleCount).toBe(SYNC.pingSamples)
    sync.reset()
    expect(sync.estimate).toBeNull()
    expect(sync.sampleCount).toBe(0)
    expect(sync.rttMs).toBe(0)
  })

  it("ignores a pong answering another device of the same member (#66)", () => {
    const host = new ClockSync(clockAt(0).clock, () => true)
    const phone = new ClockSync(clockAt(0).clock, () => false)
    const laptop = new ClockSync(clockAt(0).clock, () => false)
    phone.record(host.answer(laptop.ping("ana"), "host"))
    expect(phone.sampleCount).toBe(0)
    phone.record(host.answer(phone.ping("ana"), "host"))
    expect(phone.sampleCount).toBe(1)
  })

  it("numbers its pings", () => {
    const sync = new ClockSync(clockAt(0).clock, () => false)
    expect(sync.ping("guest").id).not.toBe(sync.ping("guest").id)
  })
})
