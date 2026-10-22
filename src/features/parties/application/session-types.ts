import type { Party } from "../domain/party"
import type { PartyState, PresenceRole } from "../domain/party-machine"
import type { PartyService } from "./party-service"
import type { Clock, PartyChannel, PlayerControl } from "./ports"

export interface SessionDeps {
  readonly me: string
  readonly joinedAt: string // from the party's members; host election orders by it
  readonly party: Party
  readonly channel: PartyChannel
  readonly player: PlayerControl | null // null for a co-watch of playback outside the app
  readonly clock: Clock
  readonly service: Pick<PartyService, "confirm" | "finish" | "handover">
  /** Netflix parties (#66): the extension is a player, the app beside it a remote. */
  readonly role?: PresenceRole | undefined
}

export interface SessionView {
  readonly state: PartyState
  readonly isHost: boolean
  readonly connected: boolean
  readonly ready: boolean
}

export const sameTimeline = (a: PartyState, b: PartyState) =>
  a.phase === b.phase &&
  a.timeline.playing === b.timeline.playing &&
  a.timeline.position === b.timeline.position &&
  a.timeline.at === b.timeline.at
