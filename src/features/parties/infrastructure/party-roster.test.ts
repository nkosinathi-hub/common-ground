import { expect, it } from "vitest"
import { PartyRoster } from "./party-roster"

const person = { userId: "me", ready: false, buffering: false, joinedAt: "today" }
it("overlays broadcasts without letting old membership snapshots revert player state", () => {
  const roster = new PartyRoster()
  expect(roster.sync({ a: [person] })).toBe(true)
  roster.update({ key: "a", person: { ...person, ready: true } })
  expect(roster.people[0]?.ready).toBe(true)
  expect(roster.sync({ a: [person] })).toBe(false)
  expect(roster.people[0]?.ready).toBe(true)
  expect(roster.update({ key: "a", person: { ...person, userId: "other" } })).toBe(false)
  expect(roster.people[0]?.ready).toBe(true)
  roster.sync({})
  expect(roster.people).toEqual([])
})

it("keeps early updates until membership arrives, and validates bounded packets", () => {
  const roster = new PartyRoster()
  roster.update({ key: "a", person: { ...person, ready: true } })
  expect(roster.people).toEqual([])
  roster.sync({ a: [null, person] })
  expect(roster.people[0]?.ready).toBe(true)
  for (const raw of [
    null,
    {},
    { key: "a", person: null },
    { key: 3, person },
    { key: "x".repeat(65), person },
  ])
    expect(roster.update(raw)).toBe(false)
})
