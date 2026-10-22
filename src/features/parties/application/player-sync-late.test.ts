import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { initialParty, type PartyState } from "../domain/party-machine"
import { playingFrom } from "../domain/timeline"
import { FakePlayer } from "../testing/fake-player"
import type { PlayerControl } from "./ports"
import { PlayerSync } from "./player-sync"

const clock = { now: () => Date.now() }
const playing: PartyState = {
  ...initialParty("host"),
  phase: "playing",
  timeline: playingFrom(10, 98_000),
}

beforeEach(() => void vi.useFakeTimers().setSystemTime(100_000))
afterEach(() => vi.useRealTimers())

// Found with two real browsers: the party page opens before anyone opens the player, so a
// player fixed at that moment was null for the whole party and nothing ever played.
describe("PlayerSync with a player that comes later", () => {
  it("asks for the current player, and puts a newly opened one on the party timeline", () => {
    let current: PlayerControl | null = null
    const sync = new PlayerSync(
      () => current,
      () => Date.now(),
    )
    sync.apply(playing)
    const player = new FakePlayer(clock)
    current = player
    sync.tick(playing)
    expect(player.calls).toEqual(["seek:12", "play"])
  })

  it("catches a player that was replaced (the player closed and opened again)", () => {
    const first = new FakePlayer(clock)
    let current: PlayerControl | null = first
    const sync = new PlayerSync(
      () => current,
      () => Date.now(),
    )
    sync.apply(playing)
    const second = new FakePlayer(clock)
    current = second
    sync.tick(playing)
    expect(second.calls).toEqual(["seek:12", "play"])
  })

  it("still takes a fixed player, as co-watch and the extension pass one", () => {
    const player = new FakePlayer(clock)
    new PlayerSync(player, () => Date.now()).apply(playing)
    expect(player.calls).toEqual(["seek:12", "play"])
  })
})
