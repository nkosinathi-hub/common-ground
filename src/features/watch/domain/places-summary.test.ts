import { describe, expect, it } from "vitest"
import { describePlaces } from "./places-summary"

const names = [
  { id: "a", displayName: "Ana" },
  { id: "b", displayName: "Ben" },
]

describe("describePlaces", () => {
  it("says where each person is, who is ahead, and where you are together", () => {
    const summary = describePlaces(
      [
        { userId: "a", status: "watching", season: 1, episode: 4 },
        { userId: "b", status: "watching", season: 1, episode: 2 },
      ],
      { season: 1, episode: 2 },
      names,
    )
    expect(summary).toEqual({
      people: [
        { userId: "a", name: "Ana", label: "S1E4", ahead: true },
        { userId: "b", name: "Ben", label: "S1E2", ahead: false },
      ],
      together: "S1E2",
    })
  })

  it("leaves out people with no episode yet, and has no together before a party", () => {
    const summary = describePlaces(
      [{ userId: "a", status: "not_started", season: null, episode: null }],
      null,
      names,
    )
    expect(summary).toEqual({ people: [], together: null })
  })

  it("marks a film watched together as done together", () => {
    expect(describePlaces([], { season: null, episode: null }, names).together).toBe("Watched")
  })

  it("names someone who left the space as a former member", () => {
    const [person] = describePlaces(
      [{ userId: "z", status: "watching", season: 2, episode: 1 }],
      { season: 2, episode: 1 },
      names,
    ).people
    expect(person).toMatchObject({ label: "S2E1", ahead: false })
    expect(person?.name).toMatch(/former/i)
  })
})
