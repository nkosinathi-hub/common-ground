import { electHost } from "../domain/host-election"
import type { PartyMessage } from "../domain/messages"
import { shouldResume, type Presence } from "../domain/party-machine"
import type { ChannelStatus } from "./ports"
import { SessionCore } from "./session-core"

/** What arrives on the channel, the sync tick and host handover. */
export abstract class SessionNetwork extends SessionCore {
  protected hostSeenAt = this.deps.clock.now()

  abstract play(): void

  protected onMessage(m: PartyMessage): void {
    const me = this.deps.me
    if (m.kind === "ping" && this.isHost) this.conn?.send(this.sync.answer(m, me))
    else if (m.kind === "pong" && m.to === me) {
      const first = this.sync.estimate === null
      this.sync.record(m)
      if (first) this.playerSync.apply(this.state)
    } else if (m.kind === "command") {
      this.lastCommandAt = Math.max(this.lastCommandAt, m.at)
      this.apply({ type: "command", by: m.from, action: m.action, position: m.position, at: m.at })
    } else if (m.kind === "state" && m.from === m.hostId) {
      this.hostSeenAt = this.deps.clock.now()
      if (!this.isHost && m.timeline.at >= this.lastCommandAt)
        this.apply({ type: "snapshot", phase: m.phase, timeline: m.timeline, hostId: m.hostId })
    } else if (m.kind === "snapshot-request" && this.isHost) this.sendState()
    else if (m.kind === "finished") this.apply({ type: "finish" })
  }

  protected onPresence(people: readonly Presence[]): void {
    if (people.some((p) => p.userId === this.state.hostId)) this.hostSeenAt = this.deps.clock.now()
    this.apply({ type: "presence", people, at: this.now() })
    if (this.isHost && shouldResume(this.state)) this.play()
  }

  protected onStatus(status: ChannelStatus): void {
    this.connected = status === "joined"
    if (this.connected) this.onJoined()
    this.emit()
  }

  /** On every (re)join: show presence again and ask the host where the party is. */
  protected onJoined(): void {
    if (!this.conn) return
    this.conn.track(this.mine)
    this.conn.send({ kind: "snapshot-request", from: this.deps.me })
  }

  private sendState(): void {
    const { phase, hostId, timeline } = this.state
    this.conn?.send({ kind: "state", from: this.deps.me, phase, hostId, timeline })
  }

  protected tick(): void {
    this.elect()
    if (this.isHost) this.sendState()
    else this.conn?.send(this.sync.ping(this.deps.me))
    this.playerSync.tick(this.state)
  }

  private elect(): void {
    const { hostId, people } = this.state
    const now = this.deps.clock.now()
    const next = electHost({ hostId, present: people, hostLastSeenAt: this.hostSeenAt, now })
    if (next === hostId) return
    const shift = next === this.deps.me ? now - this.now() : 0
    const timeline = { ...this.state.timeline, at: this.state.timeline.at + shift }
    this.apply({ type: "snapshot", phase: this.state.phase, timeline, hostId: next })
    this.hostSeenAt = now
    if (next === this.deps.me) void this.deps.service.handover(this.deps.party.id)
  }
}
