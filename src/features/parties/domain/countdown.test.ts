import { describe, expect, it } from "vitest"
import { countdownAt, countdownStart } from "./countdown"
import { SYNC } from "./sync-constants"

describe("co-watch countdown", () => {
  it("starts the countdown seconds plus the lead from now", () => {
    expect(countdownStart(1000)).toBe(1000 + SYNC.countdownS * 1000 + SYNC.scheduleLeadMs)
  })

  it("counts whole seconds down to go", () => {
    expect(countdownAt(4000, 1000)).toBe(3)
    expect(countdownAt(4000, 1001)).toBe(3)
    expect(countdownAt(4000, 2000)).toBe(2)
    expect(countdownAt(4000, 3999)).toBe(1)
    expect(countdownAt(4000, 4000)).toBe(0)
    expect(countdownAt(4000, 9000)).toBe(0)
  })

  it("never shows more than the countdown, even early", () => {
    expect(countdownAt(10_000, 0)).toBe(SYNC.countdownS)
  })
})
