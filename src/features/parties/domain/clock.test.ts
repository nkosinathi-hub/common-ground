import { describe, expect, it } from "vitest"
import { estimateOffset, sampleOffset, sharedNow, type PingSample } from "./clock"

// The peer's clock runs `offset` ms ahead; each leg of the trip takes `out` and `back` ms.
const sample = (
  sentAt: number,
  offset: number,
  out: number,
  back: number,
  hold = 2,
): PingSample => ({
  sentAt,
  peerReceivedAt: sentAt + out + offset,
  peerSentAt: sentAt + out + offset + hold,
  receivedAt: sentAt + out + hold + back,
})

describe("sampleOffset", () => {
  it("recovers the offset exactly when both legs take as long", () => {
    expect(sampleOffset(sample(1000, 250, 40, 40))).toEqual({ offsetMs: 250, rttMs: 80 })
  })

  it("leaves out the time the peer held the ping", () => {
    expect(sampleOffset(sample(0, 0, 10, 10, 500)).rttMs).toBe(20)
  })

  it("is off by half the difference between the legs", () => {
    expect(sampleOffset(sample(0, 100, 10, 50)).offsetMs).toBe(80)
  })

  it("handles a peer clock that runs behind", () => {
    expect(sampleOffset(sample(5000, -1200, 30, 30)).offsetMs).toBe(-1200)
  })
})

describe("estimateOffset", () => {
  it("has no estimate without samples", () => {
    expect(estimateOffset([])).toBeNull()
  })

  it("trusts the fastest round trips over a slow, lopsided one", () => {
    const samples = [
      sample(0, 300, 20, 20),
      sample(100, 300, 400, 20),
      sample(200, 300, 22, 22),
      sample(300, 300, 25, 25),
    ]
    expect(estimateOffset(samples)).toEqual({ offsetMs: 300, rttMs: 40 })
  })

  it("takes the median of the fastest half", () => {
    const samples = [sample(0, 100, 10, 10), sample(0, 110, 10, 10), sample(0, 500, 300, 10)]
    expect(estimateOffset(samples)?.offsetMs).toBe(105)
  })

  it("works from a single sample", () => {
    expect(estimateOffset([sample(0, -50, 5, 5)])).toEqual({ offsetMs: -50, rttMs: 10 })
  })
})

describe("sharedNow", () => {
  it("moves the local clock onto the reference clock", () => {
    expect(sharedNow(1000, { offsetMs: 250, rttMs: 10 })).toBe(1250)
  })

  it("is the local clock when nothing is known yet", () => {
    expect(sharedNow(1000, null)).toBe(1000)
  })
})
