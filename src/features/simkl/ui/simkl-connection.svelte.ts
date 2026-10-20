import type { SimklService } from "../application/simkl-service"
import { addedNote, EXPIRED, type ConnectionState } from "../domain/connection"
import type { PinStart } from "../domain/types"

/**
 * The Account card's Simkl state. While a code is shown it polls at Simkl's interval until the
 * code is approved or expires, or the card goes away; nothing else runs on a timer.
 */
export class SimklConnection {
  state = $state<ConnectionState>({ kind: "loading" })
  busy = $state(false)
  private timer: ReturnType<typeof setTimeout> | null = null
  /** Bumped by every stop, so a poll answered after a cancel or a new code is ignored. */
  private attempt = 0

  constructor(private readonly service: SimklService) {}

  async load() {
    const link = await this.service.status()
    if (!link.ok) this.state = { kind: "failed", message: link.error.message }
    else
      this.state = link.value ? { kind: "connected", link: link.value } : { kind: "disconnected" }
  }

  async connect() {
    this.stop()
    const pin = await this.run(() => this.service.startPin())
    if (!pin.ok) return void (this.state = { kind: "disconnected", note: pin.error.message })
    this.state = { kind: "pending", pin: pin.value }
    this.schedule(pin.value, Date.now() + pin.value.expiresIn * 1000)
  }

  cancel() {
    this.stop()
    this.state = { kind: "disconnected" }
  }

  async syncNow() {
    if (this.state.kind !== "connected") return
    const { link } = this.state
    const synced = await this.run(() => this.service.sync())
    if (synced.ok) {
      const next = { ...link, lastSyncedAt: synced.value.lastSyncedAt }
      this.state = { kind: "connected", link: next, note: addedNote(synced.value.added) }
    } else if (synced.error.kind === "denied") {
      this.state = { kind: "disconnected", note: synced.error.message }
    } else {
      this.state = { kind: "connected", link, note: synced.error.message }
    }
  }

  async disconnect() {
    const gone = await this.run(() => this.service.disconnect())
    if (gone.ok) this.state = { kind: "disconnected" }
    else if (this.state.kind === "connected")
      this.state = { ...this.state, note: gone.error.message }
  }

  dispose() {
    this.stop()
  }

  private schedule(pin: PinStart, deadline: number) {
    const attempt = this.attempt
    this.timer = setTimeout(() => void this.tick(pin, deadline, attempt), pin.interval * 1000)
  }

  private async tick(pin: PinStart, deadline: number, attempt: number) {
    this.timer = null
    if (Date.now() >= deadline) return void (this.state = { kind: "disconnected", note: EXPIRED })
    const reply = await this.service.poll(pin.userCode)
    if (attempt !== this.attempt || this.state.kind !== "pending") return
    if (reply.ok && reply.value.connected) return this.load()
    this.state = { kind: "pending", pin, note: reply.ok ? undefined : reply.error.message }
    this.schedule(pin, deadline)
  }

  private stop() {
    this.attempt += 1
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  private async run<T>(task: () => Promise<T>): Promise<T> {
    this.busy = true
    try {
      return await task()
    } finally {
      this.busy = false
    }
  }
}
