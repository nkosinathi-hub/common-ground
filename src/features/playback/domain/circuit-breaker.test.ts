import { describe, expect, it } from "vitest"
import { CircuitBreaker } from "./circuit-breaker"

function setup() {
  let now = 1_000
  const breaker = new CircuitBreaker({ threshold: 3, cooldownMs: 30_000 }, () => now)
  return { breaker, advance: (ms: number) => (now += ms) }
}

describe("CircuitBreaker", () => {
  it("stays closed below the failure threshold, and a success resets the count", () => {
    const { breaker } = setup()
    breaker.failure()
    breaker.failure()
    expect(breaker.state()).toBe("closed")
    breaker.success()
    breaker.failure()
    breaker.failure()
    expect(breaker.state()).toBe("closed")
  })

  it("opens at the threshold and refuses work for the cooldown", () => {
    const { breaker, advance } = setup()
    for (let i = 0; i < 3; i++) breaker.failure()
    expect(breaker.state()).toBe("open")
    advance(29_999)
    expect(breaker.state()).toBe("open")
  })

  it("half-opens after the cooldown; one success closes it", () => {
    const { breaker, advance } = setup()
    for (let i = 0; i < 3; i++) breaker.failure()
    advance(30_000)
    expect(breaker.state()).toBe("half-open")
    breaker.success()
    expect(breaker.state()).toBe("closed")
  })

  it("re-opens on a failure while half-open, for a fresh cooldown", () => {
    const { breaker, advance } = setup()
    for (let i = 0; i < 3; i++) breaker.failure()
    advance(30_000)
    breaker.failure()
    expect(breaker.state()).toBe("open")
    advance(29_000)
    expect(breaker.state()).toBe("open")
    advance(1_000)
    expect(breaker.state()).toBe("half-open")
  })
})
