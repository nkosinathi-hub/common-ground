import { describe, expect, it } from "vitest"
import { both, command, live, lobby } from "../testing/party-fixtures"
import { canStart, initialParty, reduce } from "./party-machine"
import { pausedAt, playingFrom } from "./timeline"

const play = (by: string, position: number, at: number) => command(by, "play", position, at)

describe("party lobby", () => {
  it("starts in the lobby, paused at the start", () => {
    expect(initialParty("host")).toMatchObject({ phase: "lobby", timeline: pausedAt(0, 0) })
  })

  it("can start only when everyone present tapped Ready and nobody is buffering", () => {
    expect(canStart(lobby())).toBe(true)
    expect(canStart(lobby(both({ ready: false })))).toBe(false)
    expect(canStart(lobby(both({ buffering: true })))).toBe(false)
    expect(canStart(initialParty("host"))).toBe(false)
  })

  it("lets only the host start, and only when everyone is ready", () => {
    expect(reduce(lobby(), play("guest", 0, 1000)).phase).toBe("lobby")
    expect(reduce(lobby(both({ ready: false })), play("host", 0, 1000)).phase).toBe("lobby")
    expect(live()).toMatchObject({ phase: "playing", timeline: playingFrom(0, 1000) })
  })
})

describe("snapshots, handover and the end", () => {
  it("gives a late joiner the party as it is", () => {
    const snapshot = {
      type: "snapshot",
      phase: "playing",
      timeline: playingFrom(42, 9000),
      hostId: "host",
    } as const
    expect(reduce(initialParty("unknown"), snapshot)).toMatchObject({
      phase: "playing",
      hostId: "host",
      timeline: playingFrom(42, 9000),
    })
  })

  it("follows a new host", () => {
    expect(reduce(live(), { type: "host", hostId: "guest" }).hostId).toBe("guest")
  })

  it("ends once, and nothing moves it after", () => {
    const ended = reduce(live(), { type: "finish" })
    expect(ended.phase).toBe("ended")
    expect(reduce(ended, play("host", 0, 1))).toBe(ended)
    expect(
      reduce(ended, {
        type: "snapshot",
        phase: "playing",
        timeline: playingFrom(0, 0),
        hostId: "x",
      }),
    ).toBe(ended)
  })
})
