import { describe, expect, it } from "vitest"
import { both, command, live } from "../testing/party-fixtures"
import { reduce, shouldResume } from "./party-machine"
import { pausedAt, playingFrom } from "./timeline"

const play = (by: string, position: number, at: number) => command(by, "play", position, at)

describe("live party", () => {
  it("lets anyone pause and resume", () => {
    const paused = reduce(live(), {
      type: "command",
      by: "guest",
      action: "pause",
      position: 5,
      at: 6000,
    })
    expect(paused).toMatchObject({ phase: "paused", timeline: pausedAt(5, 6000) })
    expect(reduce(paused, play("guest", 5, 7000))).toMatchObject({ phase: "playing" })
  })

  it("lets only the host seek, keeping play or pause", () => {
    const seek = (by: string) =>
      ({ type: "command", by, action: "seek", position: 60, at: 2000 }) as const
    expect(reduce(live(), seek("guest")).timeline).toEqual(playingFrom(0, 1000))
    expect(reduce(live(), seek("host")).timeline).toEqual(playingFrom(60, 2000))
    const paused = reduce(live(), {
      type: "command",
      by: "host",
      action: "pause",
      position: 3,
      at: 4000,
    })
    expect(reduce(paused, seek("host"))).toMatchObject({
      phase: "paused",
      timeline: pausedAt(60, 2000),
    })
  })

  it("holds everyone where they are while anyone buffers", () => {
    const waiting = reduce(live(), {
      type: "presence",
      people: both({ buffering: true }),
      at: 11_000,
    })
    expect(waiting).toMatchObject({ phase: "waiting", timeline: pausedAt(10, 11_000) })
    expect(shouldResume(waiting)).toBe(false)
    expect(reduce(waiting, play("guest", 10, 12_000)).phase).toBe("waiting")
    // The host resumes once it sees nobody buffering, maybe before a guest's presence catches up.
    expect(reduce(waiting, play("host", 10, 12_000)).phase).toBe("playing")
  })

  it("is ready to resume once nobody buffers, and resumes on the next play", () => {
    const waiting = reduce(live(), {
      type: "presence",
      people: both({ buffering: true }),
      at: 11_000,
    })
    const clear = reduce(waiting, { type: "presence", people: both(), at: 12_000 })
    expect(clear.phase).toBe("waiting")
    expect(shouldResume(clear)).toBe(true)
    expect(shouldResume(live())).toBe(false)
    expect(reduce(clear, play("host", 10, 12_300))).toMatchObject({ phase: "playing" })
  })

  it("does not wait for a buffering member while paused", () => {
    const paused = reduce(live(), {
      type: "command",
      by: "host",
      action: "pause",
      position: 3,
      at: 4000,
    })
    expect(
      reduce(paused, { type: "presence", people: both({ buffering: true }), at: 5000 }).phase,
    ).toBe("paused")
  })
})
