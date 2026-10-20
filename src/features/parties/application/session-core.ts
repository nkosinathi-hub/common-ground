import type { Party } from "../domain/party"
import {
  initialParty,
  reduce,
  type PartyCommand,
  type PartyEvent,
  type PartyState,
  type Presence,
} from "../domain/party-machine"
import { ClockSync } from "./clock-sync"
import type { PartyService } from "./party-service"
import { PlayerSync } from "./player-sync"
import type { Clock, PartyChannel, PartyConnection, PlayerControl } from "./ports"

export interface SessionDeps {
  readonly me: string
  /** When this member joined, from the party's members; host election orders by it. */
  readonly joinedAt: string
  readonly party: Party
  readonly channel: PartyChannel
  /** Null for a co-watch of playback outside the app. */
  readonly player: PlayerControl | null
  readonly clock: Clock
  readonly service: Pick<PartyService, "confirm" | "finish" | "handover">
}

export interface SessionView {
  readonly state: PartyState
  readonly isHost: boolean
  readonly connected: boolean
  readonly ready: boolean
}

const sameTimeline = (a: PartyState, b: PartyState) =>
  a.phase === b.phase &&
  a.timeline.playing === b.timeline.playing &&
  a.timeline.position === b.timeline.position &&
  a.timeline.at === b.timeline.at

/** State, clock and player plumbing shared by the session's handlers and actions. */
export class SessionCore {
  protected state: PartyState
  protected conn: PartyConnection | null = null
  protected connected = false
  protected mine: Presence
  protected lastCommandAt = Number.NEGATIVE_INFINITY
  protected readonly sync: ClockSync
  protected readonly playerSync: PlayerSync
  private readonly listeners = new Set<(view: SessionView) => void>()

  constructor(protected readonly deps: SessionDeps) {
    this.state = initialParty(deps.party.hostId ?? deps.me)
    this.mine = { userId: deps.me, ready: false, buffering: false, joinedAt: deps.joinedAt }
    this.sync = new ClockSync(deps.clock, () => this.isHost)
    this.playerSync = new PlayerSync(deps.player, () => this.sync.now())
  }

  get isHost(): boolean {
    return this.state.hostId === this.deps.me
  }

  get view(): SessionView {
    const { state, isHost, connected } = this
    return { state, isHost, connected, ready: this.mine.ready }
  }

  /** Shared party time in milliseconds. */
  now = (): number => this.sync.now()

  subscribe(listener: (view: SessionView) => void): () => void {
    this.listeners.add(listener)
    listener(this.view)
    return () => this.listeners.delete(listener)
  }

  protected emit(): void {
    for (const listener of this.listeners) listener(this.view)
  }

  protected apply(event: PartyEvent): void {
    const before = this.state
    this.state = reduce(before, event)
    if (before.hostId !== this.state.hostId) this.sync.reset()
    if (!sameTimeline(before, this.state)) this.playerSync.apply(this.state)
    this.emit()
  }

  /** Applies this member's own command and sends it to everyone else. */
  protected command(action: PartyCommand, position: number, at: number): void {
    this.lastCommandAt = Math.max(this.lastCommandAt, at)
    this.apply({ type: "command", by: this.deps.me, action, position, at })
    this.conn?.send({ kind: "command", from: this.deps.me, action, position, at })
  }

  protected setPresence(change: Partial<Presence>): void {
    this.mine = { ...this.mine, ...change }
    this.conn?.track(this.mine)
    this.emit()
  }
}
