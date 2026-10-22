import { describe, expect, it } from "vitest"
import type { SessionView } from "@/features/parties/application/party-session"
import {
  initialParty,
  type PartyState,
  type Presence,
} from "@/features/parties/domain/party-machine"
import { playingFrom } from "@/features/parties/domain/timeline"
import { overlayModel } from "./overlay-model"

const joinedAt = "2026-10-22T20:00:00Z"
const members = ["ana", "ben", "cat", "dan"].map((userId) => ({
  userId,
  confirmed: false,
  joinedAt,
}))
const names = [
  { id: "ana", displayName: "Ana" },
  { id: "ben", displayName: "Ben" },
  { id: "cat", displayName: "Cat" },
  { id: "dan", displayName: "Dan" },
]
const present = (userId: string, extra: Partial<Presence>): Presence => ({
  userId,
  ready: false,
  buffering: false,
  joinedAt,
  ...extra,
})
const viewOf = (state: Partial<PartyState>, extra: Partial<SessionView> = {}): SessionView => ({
  state: { ...initialParty("ana"), ...state },
  isHost: true,
  connected: true,
  ready: false,
  ...extra,
})
const model = (view: SessionView, drift: number | null = null) =>
  overlayModel({ view, members, names, drift, titleId: "81234567" })

describe("the in-page overlay", () => {
  it("shows who is in and whether they are ready on Netflix", () => {
    const people = [
      present("ana", { ready: true, role: "player" }),
      present("ben", { role: "player" }),
      present("cat", { role: "remote" }),
    ]
    expect(model(viewOf({ people })).people).toEqual([
      { name: "Ana", status: "Ready" },
      { name: "Ben", status: "Not ready" },
      { name: "Cat", status: "Remote only" },
      { name: "Dan", status: "Not here" },
    ])
  })

  it("asks for Ready first, then lets the host play together once everyone is", () => {
    const people = [present("ana", { ready: true, role: "player" })]
    expect(model(viewOf({ people }))).toMatchObject({ ready: true, play: "start", canPlay: true })
    const host = model(viewOf({ people }, { ready: true }))
    expect(host).toMatchObject({ ready: false, play: "start", line: "Waiting for everyone" })
    expect(model(viewOf({ people }, { isHost: false, ready: true })).play).toBeNull()
  })

  it("says synced within the drift tolerance and drifting beyond it", () => {
    const playing = viewOf({ phase: "playing", timeline: playingFrom(0, 0) }, { ready: true })
    expect(model(playing, 0.05)).toMatchObject({ line: "Synced", pause: true })
    expect(model(playing, -1.24).line).toBe("Drifting 1.2 s")
    expect(model(playing).line).toBe("Playing")
    expect(model(viewOf({ phase: "paused" }, { ready: true }))).toMatchObject({ play: "resume" })
  })

  it("names the Netflix title and says when the party link is lost", () => {
    const offline = model(viewOf({}, { connected: false }))
    expect(offline.heading).toBe("Common Ground party (Netflix title 81234567)")
    expect(offline.line).toBe("Reconnecting")
  })
})
