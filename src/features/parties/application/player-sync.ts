import { correction } from "../domain/drift"
import type { PartyState } from "../domain/party-machine"
import { positionAt, startsIn } from "../domain/timeline"
import type { PlayerControl } from "./ports"

/**
 * Keeps one member's player on the party timeline: apply() on every change of phase or
 * timeline, tick() on the sync interval for drift. Without a player (co-watch) it does nothing.
 */
export class PlayerSync {
  private timer: ReturnType<typeof setTimeout> | null = null
  private rate = 1

  constructor(
    private readonly player: PlayerControl | null,
    private readonly now: () => number,
  ) {}

  apply(state: PartyState): void {
    this.stop()
    const player = this.player
    if (!player) return
    const { timeline } = state
    const wait = state.phase === "playing" ? (startsIn(timeline, this.now()) ?? 0) : null
    if (wait === null) {
      player.pause()
      player.seek(timeline.position)
    } else if (wait > 0) {
      player.pause()
      player.seek(timeline.position)
      this.timer = setTimeout(() => {
        this.timer = null
        void player.play()
      }, wait)
    } else {
      player.seek(positionAt(timeline, this.now()))
      void player.play()
    }
    this.setRate(1)
  }

  tick(state: PartyState): void {
    if (!this.player || state.phase !== "playing" || this.timer) return
    if (state.timeline.at > this.now()) return
    const fix = correction(positionAt(state.timeline, this.now()), this.player.currentTime())
    if (fix.kind === "seek") {
      this.player.seek(fix.to)
      this.setRate(1)
    } else this.setRate(fix.rate)
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  private setRate(rate: number): void {
    if (rate === this.rate) return
    this.rate = rate
    this.player?.setRate(rate)
  }
}
