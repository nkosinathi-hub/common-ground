import { describe, expect, it } from "vitest"
import { correction } from "./drift"
import { SYNC } from "./sync-constants"

describe("correction", () => {
  it("plays at normal speed within the tolerance", () => {
    expect(correction(100, 100)).toEqual({ kind: "rate", rate: 1 })
    expect(correction(100, 100 + SYNC.driftToleranceS)).toEqual({ kind: "rate", rate: 1 })
  })

  it("slows down a little when slightly ahead", () => {
    expect(correction(100, 101)).toEqual({ kind: "rate", rate: 1 - SYNC.nudgeRate })
  })

  it("speeds up a little when slightly behind", () => {
    expect(correction(100, 99)).toEqual({ kind: "rate", rate: 1 + SYNC.nudgeRate })
  })

  it("nudges harder between the nudge and seek thresholds", () => {
    expect(correction(100, 103)).toEqual({ kind: "rate", rate: 1 - SYNC.strongNudgeRate })
    expect(correction(100, 97)).toEqual({ kind: "rate", rate: 1 + SYNC.strongNudgeRate })
  })

  it("treats exactly the nudge threshold as a gentle nudge", () => {
    expect(correction(100, 100 + SYNC.nudgeMaxDriftS)).toEqual({
      kind: "rate",
      rate: 1 - SYNC.nudgeRate,
    })
  })

  it("seeks to the shared position beyond the seek threshold", () => {
    expect(correction(100, 100 + SYNC.seekDriftS + 0.5)).toEqual({ kind: "seek", to: 100 })
    expect(correction(100, 90)).toEqual({ kind: "seek", to: 100 })
  })

  it("never seeks before the start", () => {
    expect(correction(-1, 20)).toEqual({ kind: "seek", to: 0 })
  })
})
