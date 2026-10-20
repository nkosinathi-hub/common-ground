import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { initialParty, type PartyState } from "../domain/party-machine"
import { SYNC } from "../domain/sync-constants"
import { pausedAt, playingFrom } from "../domain/timeline"
import { FakePlayer } from "../testing/fake-player"
import { PlayerSync } from "./player-sync"

const clock = { now: () => Date.now() }
const at = (phase: PartyState["phase"], timeline = pausedAt(0, 0)): PartyState => ({
  ...initialParty("host"),
  phase,
  timeline,
})

beforeEach(() => void vi.useFakeTimers().setSystemTime(100_000))
afterEach(() => vi.useRealTimers())

function setup() {
  const player = new FakePlayer(clock)
  return { player, sync: new PlayerSync(player, () => Date.now()) }
}

describe("PlayerSync.apply", () => {
  it("cues a scheduled start and plays exactly when it is due", () => {
    const { player, sync } = setup()
    sync.apply(at("playing", playingFrom(30, 100_300)))
    expect(player.calls).toEqual(["pause", "seek:30"])
    vi.advanceTimersByTime(299)
    expect(player.playing).toBe(false)
    vi.advanceTimersByTime(1)
    expect(player.playing).toBe(true)
  })

  it("joins a party already playing at the shared position", () => {
    const { player, sync } = setup()
    sync.apply(at("playing", playingFrom(10, 98_000)))
    expect(player.calls).toEqual(["seek:12", "play"])
  })

  it("holds the shared position when paused, waiting or ended", () => {
    for (const phase of ["paused", "waiting", "ended", "lobby"] as const) {
      const { player, sync } = setup()
      sync.apply(at(phase, pausedAt(7, 1)))
      expect(player.calls).toEqual(["pause", "seek:7"])
    }
  })

  it("cancels a scheduled start when the party pauses first", () => {
    const { player, sync } = setup()
    sync.apply(at("playing", playingFrom(0, 101_000)))
    sync.apply(at("paused", pausedAt(0, 100_500)))
    vi.advanceTimersByTime(2000)
    expect(player.playing).toBe(false)
    sync.stop()
  })
})

describe("PlayerSync.tick", () => {
  it("nudges the rate on small drift and restores it once caught up", () => {
    const { player, sync } = setup()
    const state = at("playing", playingFrom(0, 100_000))
    sync.apply(state)
    player.seek(1)
    sync.tick(state)
    expect(player.rate).toBe(1 - SYNC.nudgeRate)
    player.seek(player.currentTime() - 1)
    sync.tick(state)
    expect(player.rate).toBe(1)
  })

  it("seeks on large drift", () => {
    const { player, sync } = setup()
    const state = at("playing", playingFrom(0, 100_000))
    sync.apply(state)
    vi.advanceTimersByTime(10_000)
    player.seek(0)
    sync.tick(state)
    expect(player.currentTime()).toBeCloseTo(10)
  })

  it("leaves the player alone before a scheduled start or while paused", () => {
    const { player, sync } = setup()
    sync.apply(at("playing", playingFrom(0, 105_000)))
    const before = player.calls.length
    sync.tick(at("playing", playingFrom(0, 105_000)))
    sync.tick(at("paused"))
    expect(player.calls.length).toBe(before)
    sync.stop()
  })

  it("does nothing without a player (a co-watch of playback elsewhere)", () => {
    const sync = new PlayerSync(null, () => Date.now())
    expect(() => {
      sync.apply(at("playing", playingFrom(0, 100_000)))
      sync.tick(at("playing", playingFrom(0, 100_000)))
    }).not.toThrow()
  })
})
