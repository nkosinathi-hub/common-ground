import { describe, expect, it } from "vitest"
import { parseMessage, parsePresence } from "./messages"

const valid = [
  { kind: "ping", from: "ana", id: "p1", sentAt: 1 },
  { kind: "pong", from: "ben", to: "ana", id: "p1", sentAt: 1, peerReceivedAt: 2, peerSentAt: 3 },
  { kind: "command", from: "ana", action: "play", position: 12.5, at: 1000 },
  { kind: "command", from: "ana", action: "pause", position: 0, at: 1000 },
  { kind: "command", from: "ana", action: "seek", position: 60, at: 1000 },
  {
    kind: "state",
    from: "ana",
    phase: "playing",
    hostId: "ana",
    timeline: { playing: true, position: 3, at: 99 },
  },
  { kind: "snapshot-request", from: "ben" },
  { kind: "finished", from: "ben" },
]

describe("parseMessage", () => {
  it.each(valid)("accepts a well-formed $kind", (message) => {
    expect(parseMessage(message)).toEqual(message)
  })

  it("drops fields it does not know", () => {
    expect(parseMessage({ kind: "finished", from: "ben", extra: "<b>" })).toEqual({
      kind: "finished",
      from: "ben",
    })
  })

  it.each([
    null,
    "ping",
    { kind: "nope", from: "a" },
    { kind: "ping", from: "", id: "p", sentAt: 1 },
    { kind: "ping", from: "a", id: "p", sentAt: "1" },
    {
      kind: "pong",
      from: "a",
      to: "b",
      id: "p",
      sentAt: 1,
      peerReceivedAt: Infinity,
      peerSentAt: 1,
    },
    { kind: "command", from: "a", action: "rewind", position: 1, at: 1 },
    { kind: "command", from: "a", action: "seek", position: -1, at: 1 },
    {
      kind: "state",
      from: "a",
      phase: "dancing",
      hostId: "a",
      timeline: { playing: true, position: 1, at: 1 },
    },
    { kind: "state", from: "a", phase: "paused", hostId: "a", timeline: null },
    {
      kind: "state",
      from: "a",
      phase: "paused",
      hostId: "a",
      timeline: { playing: 1, position: 1, at: 1 },
    },
    { kind: "finished", from: "x".repeat(200) },
  ])("refuses a malformed message %#", (raw) => {
    expect(parseMessage(raw)).toBeNull()
  })
})

describe("parsePresence", () => {
  it("reads who is there, ready or buffering", () => {
    const raw = { userId: "ana", ready: true, buffering: false, joinedAt: "2026-10-22T20:00:00Z" }
    expect(parsePresence(raw)).toEqual(raw)
  })

  it("refuses anything else", () => {
    expect(
      parsePresence({ userId: "ana", ready: "yes", buffering: false, joinedAt: "x" }),
    ).toBeNull()
    expect(parsePresence(undefined)).toBeNull()
  })
})
