import {
  hasPlayer,
  initialParty,
  reduce,
  type PartyCommand,
  type PartyEvent,
  type PartyState,
  type Presence,
} from "../domain/party-machine"
import { ClockSync } from "./clock-sync"
import { PlayerSync } from "./player-sync"
import type { PartyConnection, PlayerControl } from "./ports"
import { sameTimeline, type SessionDeps, type SessionView } from "./session-types"

export type { SessionDeps, SessionView } from "./session-types"

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
    const role = deps.role ? { role: deps.role } : {}
    this.mine = {
      userId: deps.me,
      ready: false,
      buffering: false,
      joinedAt: deps.joinedAt,
      ...role,
    }
    this.sync = new ClockSync(deps.clock, () => this.isAuthority)
    this.playerSync = new PlayerSync(deps.player, () => this.sync.now())
  }

  /** The member's player now; the app may open it after the party page. */
  protected currentPlayer = (): PlayerControl | null =>
    typeof this.deps.player === "function" ? this.deps.player() : this.deps.player

  get isHost(): boolean {
    return this.state.hostId === this.deps.me
  }

  /**
   * Keeps the party clock and speaks for the host: the host's session, unless it is a remote
   * beside the host's own player (#66), which then follows that player like any guest.
   */
  get isAuthority(): boolean {
    if (!this.isHost || this.deps.role !== "remote") return this.isHost
    return !hasPlayer(this.state.people, this.deps.me)
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
    const wasAuthority = this.isAuthority
    this.state = reduce(before, event)
    if (before.hostId !== this.state.hostId || wasAuthority !== this.isAuthority) this.sync.reset()
    if (!sameTimeline(before, this.state)) this.playerSync.apply(this.state)
    this.emit()
  }

  /** Applies this member's own command and sends it to everyone else. */
  protected command(action: PartyCommand, position: number, at: number): void {
    const before = this.state
    this.apply({ type: "command", by: this.deps.me, action, position, at })
    if (this.state === before) return
    this.lastCommandAt = Math.max(this.lastCommandAt, at)
    this.conn?.send({ kind: "command", from: this.deps.me, action, position, at })
  }

  protected setPresence(change: Partial<Presence>): void {
    this.mine = { ...this.mine, ...change }
    this.conn?.track(this.mine)
    this.emit()
  }
}
