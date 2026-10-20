import { describe, expect, it } from "vitest"
import { activeSegment, hasWatchedEnough, SKIP_LABELS } from "./progress"

describe("hasWatchedEnough", () => {
  it("is true from 90 percent of the duration", () => {
    expect(hasWatchedEnough(89, 100)).toBe(false)
    expect(hasWatchedEnough(90, 100)).toBe(true)
  })

  it("is false without a usable duration", () => {
    expect(hasWatchedEnough(10, 0)).toBe(false)
    expect(hasWatchedEnough(10, Number.NaN)).toBe(false)
    expect(hasWatchedEnough(10, Number.POSITIVE_INFINITY)).toBe(false)
  })
})

describe("activeSegment", () => {
  const segments = [
    { kind: "recap", start: 0, end: 30 },
    { kind: "intro", start: 40, end: 90 },
    { kind: "credits", start: 1200, end: 1260 },
  ] as const

  it("finds the segment the playhead is in, end exclusive", () => {
    expect(activeSegment(segments, 45)?.kind).toBe("intro")
    expect(activeSegment(segments, 0)?.kind).toBe("recap")
    expect(activeSegment(segments, 90)).toBeNull()
    expect(activeSegment(segments, 35)).toBeNull()
  })

  it("labels each skippable kind", () => {
    expect(SKIP_LABELS.intro).toBe("Skip intro")
    expect(SKIP_LABELS.credits).toBe("Skip credits")
    expect(SKIP_LABELS.recap).toBe("Skip recap")
    expect(SKIP_LABELS.preview).toBe("Skip preview")
  })
})
