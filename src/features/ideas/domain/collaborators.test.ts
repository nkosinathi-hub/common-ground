import { describe, expect, it } from "vitest"
import { invitationFor, isOurs, isShared, peopleOf, rosterChanges } from "./collaborators"
import type { Idea } from "./idea"

const at = "2026-10-16T09:00:00Z"
const idea = {
  createdBy: "ana",
  collaborators: [
    { userId: "ben", invitedBy: "ana", invitedAt: at, acceptedAt: at },
    { userId: "cy", invitedBy: "ben", invitedAt: at, acceptedAt: null },
  ],
} as unknown as Idea

describe("idea collaborators", () => {
  it("lists the author first, then accepted collaborators; pending invites are not people yet", () => {
    expect(peopleOf(idea)).toEqual(["ana", "ben"])
    expect(peopleOf({ ...idea, createdBy: null })).toEqual(["ben"])
  })

  it("is ours for the author and accepted collaborators only", () => {
    expect(isOurs(idea, "ana")).toBe(true)
    expect(isOurs(idea, "ben")).toBe(true)
    expect(isOurs(idea, "cy")).toBe(false)
    expect(isOurs(idea, "")).toBe(false)
  })

  it("is shared once a second person has joined", () => {
    expect(isShared(idea)).toBe(true)
    expect(isShared({ ...idea, collaborators: [] })).toBe(false)
  })

  it("finds the viewer's pending invitation", () => {
    expect(invitationFor(idea, "cy")).toMatchObject({ invitedBy: "ben" })
    expect(invitationFor(idea, "ben")).toBeNull()
  })

  it("works out who to invite and who to remove from a picked roster", () => {
    const changes = rosterChanges(idea, new Set(["ana", "cy", "dee"]))
    expect(changes).toEqual({ invite: ["dee"], remove: ["ben"] })
  })
})
