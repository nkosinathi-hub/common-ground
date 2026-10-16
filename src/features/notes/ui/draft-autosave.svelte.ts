import type { Result } from "@/shared/domain"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

/** Seconds after typing stops before saving, and before trying again after a failure. */
export const SAVE_DELAY_MS = 1500
export const RETRY_MS = 4000

/**
 * Saves a draft as the author writes: at once on the first change (which creates it), then
 * after a pause, on close and when the tab is hidden. Saves run one at a time and always send
 * the latest text, so the last save wins.
 */
export class DraftAutosave {
  status = $state<SaveStatus>("idle")
  private timer: ReturnType<typeof setTimeout> | null = null
  private chain: Promise<void> = Promise.resolve()
  private dirty = false
  private stopped = false

  constructor(
    private readonly save: (id: string | null) => Promise<Result<string>>,
    public id: string | null = null,
  ) {}

  /** Something changed: save now if the draft does not exist yet, otherwise after a pause. */
  changed(): void {
    if (this.stopped) return
    this.dirty = true
    if (this.id === null && this.status === "idle") void this.flush()
    else this.arm(SAVE_DELAY_MS)
  }

  /** Saves any change now; true once everything is saved. */
  flush(): Promise<boolean> {
    this.clear()
    if (this.dirty && !this.stopped) {
      this.dirty = false
      this.status = "saving"
      this.chain = this.chain.then(() => this.run())
    }
    return this.chain.then(() => this.status !== "error")
  }

  /** No more saves: the draft was sent or deleted, or the composer closed. */
  stop(): void {
    this.stopped = true
    this.clear()
  }

  /** Saves again after a stop, when sending failed and the author keeps writing. */
  resume(): void {
    this.stopped = false
  }

  private async run() {
    const saved = await this.save(this.id)
    if (saved.ok) {
      this.id = saved.value
      this.status = this.dirty ? "saving" : "saved"
      return
    }
    this.status = "error"
    this.dirty = true
    this.arm(RETRY_MS)
  }

  private arm(ms: number) {
    this.clear()
    this.timer = setTimeout(() => void this.flush(), ms)
  }

  private clear() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }
}
