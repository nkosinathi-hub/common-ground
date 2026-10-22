import { correction } from "../domain/drift"
import type { PartyState } from "../domain/party-machine"
import { positionAt, startsIn } from "../domain/timeline"
import type { PlayerControl } from "./ports"

/** The member's player now: fixed (co-watch, the extension), or whatever the app shows. */
export type PlayerSource = PlayerControl | null | (() => PlayerControl | null)

/**
 * Keeps one member's player on the party timeline: apply() on every change of phase or
 * timeline, tick() on the sync interval for drift. The player is asked for each time, since
 * it is often opened after the party (or reopened); tick() puts a new one on the timeline.
 * Without a player (co-watch) it does nothing.
 */
export class PlayerSync {
  private timer: ReturnType<typeof setTimeout> | null = null
  private rate = 1
  private applied: PlayerControl | null = null
  private readonly current: () => PlayerControl | null

  constructor(
    source: PlayerSource,
    private readonly now: () => number,
  ) {
    this.current = typeof source === "function" ? source : () => source
  }

  private get player(): PlayerControl | null {
    return this.current()
  }

  apply(state: PartyState): void {
    this.stop()
    const player = this.player
    this.applied = player
    if (!player) return
    this.rate = 1
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
    if (this.player !== this.applied) return this.apply(state)
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
