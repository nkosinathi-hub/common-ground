import type { Result } from "../../../shared/domain/result"
import { hasWatchedEnough } from "../domain/progress"
import type { PlaybackEventKind, Provider } from "../domain/provider.types"
import type { PlayableSource } from "../domain/source.types"

export interface ProgressDeps {
  readonly source: PlayableSource
  readonly provider?: Provider
  /** Called once, when 90 percent has played; the watch data model decides what it records. */
  readonly watched: () => Promise<Result<void>>
  readonly clock: () => number
  readonly intervalMs?: number
}

/** Reports playback to the source's provider every 10 s, and marks the title watched once. */
export class ProgressReporter {
  private last = Number.NEGATIVE_INFINITY
  private marked = false

  constructor(private readonly deps: ProgressDeps) {}

  private async send(
    kind: PlaybackEventKind,
    position: number,
    paused: boolean,
    keepalive = false,
  ) {
    const { provider, source } = this.deps
    try {
      await provider?.report?.({ kind, source, positionSeconds: position, paused, keepalive })
    } catch {
      // Reporting is best effort: a lost report must never interrupt playback.
    }
  }

  async start(position: number): Promise<void> {
    this.last = this.deps.clock()
    await this.send("start", position, false)
  }

  async tick(position: number, duration: number, paused: boolean): Promise<void> {
    if (!this.marked && hasWatchedEnough(position, duration)) {
      this.marked = true
      await this.deps.watched()
    }
    const now = this.deps.clock()
    if (now - this.last < (this.deps.intervalMs ?? 10_000)) return
    this.last = now
    await this.send("progress", position, paused)
  }

  /** `keepalive` on pagehide, so the stop survives the page closing. */
  async stop(position: number, keepalive: boolean): Promise<void> {
    await this.send("stop", position, true, keepalive)
  }
}
