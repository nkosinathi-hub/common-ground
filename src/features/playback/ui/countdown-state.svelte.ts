/** The play-next countdown: ticks once a second and calls `done` once at zero. */
export class CountdownState {
  remaining = $state(0)
  running = $state(false)
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(private readonly done: () => void) {}

  start(seconds: number): void {
    this.cancel()
    this.remaining = seconds
    this.running = true
    this.timer = setInterval(() => {
      this.remaining -= 1
      if (this.remaining > 0) return
      this.cancel()
      this.done()
    }, 1_000)
  }

  cancel(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.running = false
  }
}
