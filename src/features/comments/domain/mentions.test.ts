import { describe, expect, it } from "vitest"
import { FORMER_MEMBER, mentionCandidates, nameOf, namesOf } from "./mentions"

const members = [
  { id: "me", displayName: "Nkosi" },
  { id: "b", displayName: "Zola" },
  { id: "c", displayName: "anele" },
  { id: "d", displayName: "Andile" },
]

describe("mention picker", () => {
  it("offers other members sorted by name, never me", () => {
    expect(mentionCandidates(members, "", "me", []).map((m) => m.id)).toEqual(["d", "c", "b"])
  })

  it("filters by a case-insensitive name fragment and hides chosen members", () => {
    expect(mentionCandidates(members, " AN ", "me", []).map((m) => m.id)).toEqual(["d", "c"])
    expect(mentionCandidates(members, "an", "me", ["d"]).map((m) => m.id)).toEqual(["c"])
    expect(mentionCandidates(members, "q", "me", [])).toEqual([])
  })

  it("renders ids as names and labels people who left", () => {
    expect(nameOf("b", members)).toBe("Zola")
    expect(nameOf("gone", members)).toBe(FORMER_MEMBER)
    expect(nameOf(null, members)).toBe(FORMER_MEMBER)
    expect(namesOf(["c", "gone"], members)).toEqual(["anele", FORMER_MEMBER])
  })
})
