import type { PlayerSource } from "./player-sync"
import type { Party } from "../domain/party"
import type { PartyState, PresenceRole } from "../domain/party-machine"
import type { PartyService } from "./party-service"
import type { Clock, PartyChannel } from "./ports"

export interface SessionDeps {
  readonly me: string
  readonly joinedAt: string // from the party's members; host election orders by it
  readonly party: Party
  readonly channel: PartyChannel
  /** The player now (a function when the app opens it later); null for a co-watch. */
  readonly player: PlayerSource
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
