import { describe, expect, it, vi } from "vitest"
import { SYNC } from "../domain/sync-constants"
import { partyRoom, readyRoom, useFakeClock } from "../testing/session-setup"

useFakeClock()

describe("PartySession clock and start", () => {
  it("connects to the party's topic and learns the host clock", async () => {
    const { hub, host, guest } = await readyRoom()
    expect(hub.topics).toEqual(["party:p1", "party:p1"])
    expect(guest.session.now()).toBe(host.session.now())
    expect(host.session.isHost).toBe(true)
    expect(guest.session.isHost).toBe(false)
  })

  it("confirms on Ready, after arming the player in the tap", async () => {
    const room = partyRoom()
    const host = room.member("host")
    await host.session.ready()
    expect(host.player.calls.slice(0, 2)).toEqual(["play", "pause"])
    expect(room.service.calls).toEqual([["confirm", "p1"]])
    expect(host.session.view.ready).toBe(true)
  })

  it("will not start until everyone tapped Ready", () => {
    const room = partyRoom()
    const host = room.member("host")
    room.member("guest")
    void host.session.ready()
    host.session.play()
    expect(host.session.view.state.phase).toBe("lobby")
  })

  it("starts every player at the same shared moment, the lead time ahead", async () => {
    const { host, guest } = await readyRoom()
    host.session.play()
    expect(guest.session.view.state.phase).toBe("playing")
    vi.advanceTimersByTime(SYNC.scheduleLeadMs - 1)
    expect([host.player.playing, guest.player.playing]).toEqual([false, false])
    vi.advanceTimersByTime(1)
    expect([host.player.playing, guest.player.playing]).toEqual([true, true])
    vi.advanceTimersByTime(5000)
    expect(guest.player.currentTime()).toBeCloseTo(host.player.currentTime(), 2)
  })
})

describe("PartySession controls", () => {
  it("lets anyone pause for everyone", async () => {
    const { host, guest } = await readyRoom()
    host.session.play()
    vi.advanceTimersByTime(2000)
    guest.session.pause()
    expect(host.session.view.state.phase).toBe("paused")
    expect(host.player.playing).toBe(false)
  })

  it("follows only the host's seeks", async () => {
    const { host, guest } = await readyRoom()
    host.session.play()
    vi.advanceTimersByTime(1000)
    guest.session.seek(600)
    expect(host.player.currentTime()).toBeLessThan(5)
    host.session.seek(60)
    vi.advanceTimersByTime(SYNC.scheduleLeadMs)
    expect(guest.player.currentTime()).toBeCloseTo(60, 1)
  })

  it("nudges a drifting player back with the playback rate", async () => {
    const { host, guest } = await readyRoom()
    host.session.play()
    vi.advanceTimersByTime(2000)
    guest.player.seek(guest.player.currentTime() + 1)
    vi.advanceTimersByTime(SYNC.stateIntervalMs)
    expect(guest.player.rate).toBe(1 - SYNC.nudgeRate)
  })

  it("finishes through the server, then ends for everyone", async () => {
    const { host, guest, service } = await readyRoom()
    host.session.play()
    expect((await guest.session.finish()).ok).toBe(true)
    expect(service.calls).toContainEqual(["finish", "p1"])
    expect(host.session.view.state.phase).toBe("ended")
    expect(guest.session.view.state.phase).toBe("ended")
  })
})
