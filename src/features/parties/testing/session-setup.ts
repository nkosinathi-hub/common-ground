import { ok } from "@/shared/domain"
import { PartySession } from "../application/party-session"
import { FakePartyHub } from "./fake-party-hub"
import { FakePlayer } from "./fake-player"
import { partyOf } from "./fake-party-gateway"

/** The RPCs a session calls, recorded as [name, partyId]. */
export function sessionService() {
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
  const member = (me: string, withPlayer = true) => {
    const clock = { now: () => Date.now() + (skews[me] ?? 0) }
    const player = withPlayer ? new FakePlayer(clock) : null
    joined += 1
    const joinedAt = `2026-10-22T20:00:0${joined}Z`
    const session = new PartySession({ me, joinedAt, party, channel: hub, player, clock, service })
    session.open()
    return { session, player: player!, clock }
  }
  return { hub, service, member }
}
