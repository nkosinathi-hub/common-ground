import { appError, err, type Result } from "@/shared/domain"
import { countdownStart } from "../domain/countdown"
import { canStart } from "../domain/party-machine"
import { SYNC } from "../domain/sync-constants"
import { positionAt, scheduledStart } from "../domain/timeline"
import { PlayerEvents, preparePlayer } from "./player-events"
import { SessionNetwork } from "./session-network"

export type { SessionDeps, SessionView } from "./session-core"

/** One member on the shared timeline; ready members control each other. */
export class PartySession extends SessionNetwork {
  private interval: ReturnType<typeof setInterval> | null = null
  private readonly events = new PlayerEvents()

  open(): void {
    const { channel, party } = this.deps
    this.conn = channel.connect(party.id, {
      onMessage: (m) => this.onMessage(m),
      onPresence: (people) => this.onPresence(people),
      onStatus: (status) => this.onStatus(status),
    })
    this.onJoined()
    this.watchBuffering()
    this.interval = setInterval(() => {
      this.watchBuffering()
      this.tick()
    }, SYNC.stateIntervalMs)
  }

  private watchBuffering(): void {
    const player = this.currentPlayer()
    if (!player && this.deps.party.source === "jellyfin" && this.mine.ready)
      this.setPresence({ ready: false, buffering: false })
    this.events.bind(
      player,
      (buffering) => this.setPresence({ buffering }),
      (action, position) => {
        if (!this.mine.ready) return
        if (action === "play") this.play()
        else if (action === "pause") this.pause()
        else this.seek(position)
      },
    )
  }

  close(): void {
    if (this.interval) clearInterval(this.interval)
    this.playerSync.stop()
    this.events.close()
    this.conn?.leave()
    this.conn = null
  }

  async ready(): Promise<Result<void>> {
    const player = this.currentPlayer()
    if (this.deps.party.source === "jellyfin" && (!player || player.isReady?.() === false))
      return err(appError("validation", "Wait for the video to load, then tap Ready"))
    this.watchBuffering()
    const armed = await preparePlayer(player)
    if (!armed.ok) return armed
    const confirmed = await this.deps.service.confirm(this.deps.party.id)
    if (confirmed.ok) {
      this.setPresence({ ready: true, buffering: false })
      this.playerSync.apply(this.state)
    }
    return confirmed
  }

  play(): void {
    if (!this.mayStart()) return
    const now = this.now()
    const start = scheduledStart(positionAt(this.state.timeline, now), now, this.sync.rttMs)
    this.command("play", start.position, start.at)
  }

  countdown(): void {
    if (this.isHost && this.mayStart())
      this.command("play", positionAt(this.state.timeline, this.now()), countdownStart(this.now()))
  }

  private mayStart = () =>
    (this.mine.ready || this.deps.role === "remote") &&
    (this.state.phase !== "lobby" || canStart(this.state))

  pause = (): void => this.command("pause", positionAt(this.state.timeline, this.now()), this.now())

  seek(seconds: number): void {
    if (!this.mine.ready || !Number.isFinite(seconds)) return
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
