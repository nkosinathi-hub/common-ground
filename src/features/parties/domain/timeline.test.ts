import { describe, expect, it } from "vitest"
import { SYNC } from "./sync-constants"
import { pausedAt, playingFrom, positionAt, scheduledStart, startsIn } from "./timeline"

describe("timeline", () => {
  it("holds a paused position", () => {
    expect(positionAt(pausedAt(42, 1000), 99_000)).toBe(42)
  })

  it("advances a playing position in real time", () => {
    expect(positionAt(playingFrom(10, 1000), 3500)).toBe(12.5)
  })

  it("does not move before a scheduled start", () => {
    expect(positionAt(playingFrom(10, 5000), 4000)).toBe(10)
  })

  it("says how long until a scheduled start, never less than zero", () => {
    expect(startsIn(playingFrom(0, 5000), 4700)).toBe(300)
    expect(startsIn(playingFrom(0, 5000), 6000)).toBe(0)
    expect(startsIn(pausedAt(0, 5000), 4000)).toBeNull()
  })
})

describe("scheduledStart", () => {
  it("starts the shared lead time ahead on a fast link", () => {
    expect(scheduledStart(30, 1000, 40)).toEqual(playingFrom(30, 1000 + SYNC.scheduleLeadMs))
  })

  it("waits a full round trip when the link is slower than the lead", () => {
    expect(scheduledStart(0, 1000, 900)).toEqual(playingFrom(0, 1900))
  })
})
