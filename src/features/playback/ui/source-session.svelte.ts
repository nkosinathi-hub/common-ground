import { SvelteSet } from "svelte/reactivity"
import type { PlayableSource } from "../domain/source.types"
import type { Playing, PlaybackService } from "../application/playback-service"
import type { PlayTarget } from "../application/ports"

/** A finite recovery pass preserves position and ignores duplicate failures from an old engine. */
export class SourceSession {
  index = $state(0)
  resume = $state<number | null>(null)
  sources = $state.raw<Playing["sources"]>([])
  refreshing = $state(false)
  autoplay = $state(true)
  message = $state("")
  private recovered = false
  private recoveryPosition = 0
  private controller = new AbortController()
  private failed = new SvelteSet<PlayableSource>()
  constructor(
    readonly playing: Playing,
    private service: PlaybackService,
    private target: PlayTarget,
    private allowRenewal = true,
  ) {
    this.sources = playing.sources
  }
  get source() {
    const source = this.sources[this.index]
    return source
      ? { ...source, ...(this.resume === null ? {} : { resumeSeconds: this.resume }) }
      : null
  }
  select(index: number, time: number, paused = false) {
    const selected = this.sources[index]
    if (!selected) return
    this.failed.delete(selected)
    this.autoplay = !paused
    this.resume = time
    this.index = index
    this.message = ""
  }
  async fail(source: PlayableSource | null, time: number, expired = false, paused?: boolean) {
    const current = this.sources[this.index]
    if (
      !current ||
      !source ||
      source.url !== current.url ||
      this.failed.has(current) ||
      this.refreshing
    )
      return
    if (paused !== undefined) this.autoplay = !paused
    this.failed.add(current)
    this.resume = time
    if (!expired && this.sources[this.index + 1]) {
      this.index++
      this.message = "Switching source, keeping your place…"
      return
    }
    this.index = this.sources.length
    if (!this.allowRenewal) return
    if (this.recovered && time < this.recoveryPosition + 60) return
    this.recoveryPosition = time
    this.recovered = this.refreshing = true
    this.message = "Refreshing playback, keeping your place…"
    try {
      const result = await this.service.refresh(
        this.target,
        this.playing,
        current,
        this.controller.signal,
      )
      if (this.controller.signal.aborted) return
      if (result.ok) {
        this.sources = result.value.sources
        this.index = 0
        this.failed.clear()
      }
    } catch {
      this.index = this.sources.length
    } finally {
      this.refreshing = false
      this.message = ""
    }
  }
  retry = (fallback?: () => void) => {
    if (this.refreshing) return
    if (!this.allowRenewal) return fallback?.()
    this.index = Math.min(this.index, this.sources.length - 1)
    this.failed.clear()
    this.recovered = false
    return this.fail(this.source, this.resume ?? 0, true)
  }
  ready = () => {
    this.message = ""
    this.autoplay = true
  }
  dispose = () => this.controller.abort()
}
