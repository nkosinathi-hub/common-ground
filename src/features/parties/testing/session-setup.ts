import { afterEach, beforeEach, vi } from "vitest"
import { ok } from "@/shared/domain"
import { PartySession } from "../application/party-session"
import type { PresenceRole } from "../domain/presence"
import { SYNC } from "../domain/sync-constants"
import { FakePartyHub } from "./fake-party-hub"
import { FakePlayer } from "./fake-player"
import { partyOf } from "./fake-party-gateway"

/** The RPCs a session calls, recorded as [name, partyId]. */
function sessionService() {
  const calls: string[][] = []
  const record = (name: string) => (id: string) => {
    calls.push([name, id])
    return Promise.resolve(ok(undefined))
  }
  return {
    calls,
    confirm: record("confirm"),
    finish: record("finish"),
    handover: record("handover"),
  }
}

/**
 * Members of one party on one fake channel. Each member's local clock is skewed by its offset
 * from Date.now(), so a guest must learn the host's clock. The host is "host".
 */
export function partyRoom(skews: Record<string, number> = { host: 0, guest: 700 }) {
  const hub = new FakePartyHub()
  const service = sessionService()
  const party = partyOf("p1", "host")
  let joined = 0
  const member = (me: string, withPlayer = true, role?: PresenceRole) => {
    const skew = skews[`${me}/${role}`] ?? skews[me] ?? 0 // "host/remote": the host's phone
    const clock = { now: () => Date.now() + skew }
    const player = withPlayer ? new FakePlayer(clock) : null
    joined += 1
    const joinedAt = `2026-10-22T20:00:0${joined}Z`
    const deps = { me, joinedAt, party, channel: hub, player, clock, service, role }
    const session = new PartySession(deps)
    session.open()
    return { session, player: player!, clock }
  }
  return { hub, service, member }
}

/** Fake timers from a fixed instant, for every test in the calling file. */
export function useFakeClock(): void {
  beforeEach(() => void vi.useFakeTimers().setSystemTime(1_000_000))
  afterEach(() => vi.useRealTimers())
}

/** Host and guest connected, both Ready, and the guest synced to the host's clock. */
export async function readyRoom(skews?: Record<string, number>, withPlayers = true) {
  const room = partyRoom(skews)
  const host = room.member("host", withPlayers)
  const guest = room.member("guest", withPlayers)
  await host.session.ready()
  await guest.session.ready()
  vi.advanceTimersByTime(3 * SYNC.stateIntervalMs)
  return { ...room, host, guest }
}
