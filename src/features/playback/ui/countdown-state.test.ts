import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CountdownState } from "./countdown-state.svelte"

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe("CountdownState", () => {
  it("counts down each second and fires once at zero", () => {
    const done = vi.fn()
    const countdown = new CountdownState(done)
    countdown.start(3)
    expect(countdown.remaining).toBe(3)
    vi.advanceTimersByTime(2_000)
    expect(countdown.remaining).toBe(1)
    vi.advanceTimersByTime(1_000)
    expect(done).toHaveBeenCalledTimes(1)
    expect(countdown.running).toBe(false)
    vi.advanceTimersByTime(5_000)
    expect(done).toHaveBeenCalledTimes(1)
  })

  it("cancels, and a second start restarts", () => {
    const done = vi.fn()
    const countdown = new CountdownState(done)
    countdown.start(5)
    countdown.cancel()
    vi.advanceTimersByTime(10_000)
    expect(done).not.toHaveBeenCalled()
    countdown.start(2)
    countdown.start(2)
    vi.advanceTimersByTime(2_000)
    expect(done).toHaveBeenCalledTimes(1)
  })
})
