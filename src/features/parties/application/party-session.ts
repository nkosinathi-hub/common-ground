import type { Result } from "@/shared/domain"
import { countdownStart } from "../domain/countdown"
import { canStart } from "../domain/party-machine"
import { SYNC } from "../domain/sync-constants"
import { positionAt, scheduledStart } from "../domain/timeline"
import { SessionNetwork } from "./session-network"

export type { SessionDeps, SessionView } from "./session-core"

/**
 * One member's live party: the host's clock is the reference, the host owns seeks and keeps
 * everyone's state, anyone pauses. Host-only rules hold client-side over broadcast; progress is
 * credited only by the server (finish_party). docs/parties.md has the protocol.
 */
export class PartySession extends SessionNetwork {
  private interval: ReturnType<typeof setInterval> | null = null
  private unbuffer: (() => void) | null = null

  open(): void {
    const { channel, party, player } = this.deps
    this.conn = channel.connect(party.id, {
      onMessage: (m) => this.onMessage(m),
      onPresence: (people) => this.onPresence(people),
      onStatus: (status) => this.onStatus(status),
    })
    this.onJoined()
    this.unbuffer = player?.onBuffering((buffering) => this.setPresence({ buffering })) ?? null
    this.interval = setInterval(() => this.tick(), SYNC.stateIntervalMs)
  }

  close(): void {
    if (this.interval) clearInterval(this.interval)
    this.playerSync.stop()
    this.unbuffer?.()
    this.conn?.leave()
    this.conn = null
  }

  /** The Ready tap: unlocks playback inside the gesture, confirms, then shows ready. */
  async ready(): Promise<Result<void>> {
    const player = this.deps.player
    if (player) {
      void player.play().catch(() => undefined)
      player.pause()
    }
    const confirmed = await this.deps.service.confirm(this.deps.party.id)
    if (confirmed.ok) this.setPresence({ ready: true })
    return confirmed
  }

  play(): void {
    if (!this.mayStart()) return
    const now = this.now()
    const start = scheduledStart(positionAt(this.state.timeline, now), now, this.sync.rttMs)
    this.command("play", start.position, start.at)
  }

  /** Co-watch: a shared 3-2-1 to pressing play on the TV together. */
  countdown(): void {
    if (this.mayStart())
      this.command("play", positionAt(this.state.timeline, this.now()), countdownStart(this.now()))
  }

  private mayStart = () => this.state.phase !== "lobby" || (this.isHost && canStart(this.state))

  pause = (): void => this.command("pause", positionAt(this.state.timeline, this.now()), this.now())

  seek(seconds: number): void {
    if (!this.isHost) return
    this.command("seek", Math.max(0, seconds), this.now() + SYNC.scheduleLeadMs)
  }

  async finish(): Promise<Result<void>> {
    const done = await this.deps.service.finish(this.deps.party.id)
    if (!done.ok) return done
    this.apply({ type: "finish" })
    this.conn?.send({ kind: "finished", from: this.deps.me })
    return done
  }
}
