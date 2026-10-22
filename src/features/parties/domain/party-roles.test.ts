import { describe, expect, it } from "vitest"
import { parsePresence } from "./messages"
import { canStart, hasPlayer, initialParty, reduce, type Presence } from "./party-machine"

const at = "2026-10-22T20:00:00Z"
const person = (userId: string, ready: boolean, role?: Presence["role"]): Presence => ({
  userId,
  ready,
  buffering: false,
  joinedAt: at,
  ...(role ? { role } : {}),
})
const withPeople = (people: Presence[]) =>
  reduce(initialParty("ana"), { type: "presence", people, at: 0 })

describe("player and remote presence (#66)", () => {
  it("reads a member's role, and leaves it out when there is none", () => {
    const raw = { userId: "ana", ready: true, buffering: false, joinedAt: at }
    expect(parsePresence({ ...raw, role: "player" })).toEqual({ ...raw, role: "player" })
    expect(parsePresence({ ...raw, role: "remote" })).toEqual({ ...raw, role: "remote" })
    expect(parsePresence(raw)).toEqual(raw)
    expect(parsePresence({ ...raw, role: "admin" })).toBeNull()
  })

  it("waits only for the players to be ready when any are connected", () => {
    const people = [person("ana", true, "player"), person("ana", false, "remote")]
    expect(canStart(withPeople(people))).toBe(true)
    expect(canStart(withPeople([...people, person("ben", false, "player")]))).toBe(false)
  })

  it("waits for everyone when nobody has a player connected", () => {
    const people = [person("ana", true, "remote"), person("ben", false, "remote")]
    expect(canStart(withPeople(people))).toBe(false)
    expect(canStart(withPeople([people[0]!]))).toBe(true)
  })

  it("tells whether a member has a player connected", () => {
    const people = [person("ana", true, "remote"), person("ben", true, "player")]
    expect(hasPlayer(people, "ben")).toBe(true)
    expect(hasPlayer(people, "ana")).toBe(false)
    expect(hasPlayer(people)).toBe(true)
    expect(hasPlayer([person("ana", true, "remote")])).toBe(false)
  })
})
