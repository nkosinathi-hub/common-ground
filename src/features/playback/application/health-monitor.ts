import { CircuitBreaker, type BreakerOptions, type BreakerState } from "../domain/circuit-breaker"
import type { RegisteredProvider } from "./plugin-registry"

/** One circuit breaker per provider id; a half-open provider must pass its health probe. */
export class HealthMonitor {
  private readonly breakers = new Map<string, CircuitBreaker>()

  constructor(
    private readonly options: BreakerOptions,
    private readonly clock: () => number,
  ) {}

  private breaker(id: string): CircuitBreaker {
    let breaker = this.breakers.get(id)
    if (!breaker) {
      breaker = new CircuitBreaker(this.options, this.clock)
      this.breakers.set(id, breaker)
    }
    return breaker
  }

  state(id: string): BreakerState {
    return this.breaker(id).state()
  }

  success(id: string): void {
    this.breaker(id).success()
  }

  failure(id: string): void {
    this.breaker(id).failure()
  }

  /** Whether to ask this provider now. Without a probe, half-open lets one trial through. */
  async admit(entry: RegisteredProvider, signal: AbortSignal): Promise<boolean> {
    const id = entry.config.id
    const state = this.state(id)
    if (state !== "half-open") return state === "closed"
    if (!entry.plugin.capabilities.health) return true
    const healthy = await entry.provider.health(signal).then(
      (result) => result.ok,
      () => false,
    )
    if (healthy) this.success(id)
    else this.failure(id)
    return healthy
  }
}
