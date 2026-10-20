export type BreakerState = "closed" | "open" | "half-open"

export interface BreakerOptions {
  /** Consecutive failures that open the circuit. */
  readonly threshold: number
  /** How long an open circuit refuses work before one trial (half-open). */
  readonly cooldownMs: number
}

/** Closed until `threshold` failures in a row, open for `cooldownMs`, then half-open for a trial. */
export class CircuitBreaker {
  private failures = 0
  private openedAt: number | null = null

  constructor(
    private readonly options: BreakerOptions,
    private readonly clock: () => number,
  ) {}

  state(): BreakerState {
    if (this.openedAt === null) return "closed"
    return this.clock() - this.openedAt >= this.options.cooldownMs ? "half-open" : "open"
  }

  success(): void {
    this.failures = 0
    this.openedAt = null
  }

  failure(): void {
    if (this.state() === "half-open") {
      this.openedAt = this.clock()
      return
    }
    this.failures += 1
    if (this.failures >= this.options.threshold) this.openedAt = this.clock()
  }
}
