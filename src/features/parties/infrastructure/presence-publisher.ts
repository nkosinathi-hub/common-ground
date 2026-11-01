import type { Presence } from "../domain/party-machine"

/** Coalesce buffering bursts so rapid HLS seeks cannot exceed Realtime presence limits. */
export class PresencePublisher {
  private latest: Presence | null = null
  private sent = ""
  private last = -Infinity
  private connected = false
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private readonly send: (value: Presence) => void,
    private readonly intervalMs = 500,
  ) {}

  track(value: Presence): void {
    const ready = value.ready && !this.latest?.ready
    this.latest = value
    if (ready) this.last = -Infinity // Publish readiness before the viewer sends controls.
    this.flush()
  }

  online(connected: boolean): void {
    if (this.connected === connected) return
    this.connected = connected
    this.clear()
    if (connected) {
      this.sent = "" // A rejoined channel needs one fresh presence, even when unchanged.
      this.flush()
    }
  }

  close(): void {
    this.connected = false
    this.clear()
  }

  private clear(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  private flush(): void {
    if (!this.connected || !this.latest) return
    const key = JSON.stringify(this.latest)
    if (key === this.sent) return
    const delay = this.last + this.intervalMs - Date.now()
    if (delay > 0) {
      this.timer ??= setTimeout(() => {
        this.timer = null
        this.flush()
      }, delay)
      return
    }
    this.clear()
    this.last = Date.now()
    this.sent = key
    this.send(this.latest)
  }
}
