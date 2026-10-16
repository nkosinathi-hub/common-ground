import { describe, expect, it } from "vitest"
import { rsvpSummary } from "./rsvp"

const attendees = [
  { userId: "ana", rsvp: "going" as const },
  { userId: "ben", rsvp: "maybe" as const },
  { userId: "cai", rsvp: "pending" as const },
  { userId: "dee", rsvp: "going" as const },
  { userId: "eve", rsvp: "declined" as const },
]
const names = (id: string) =>
  ({ ana: "Ana", ben: "Ben", dee: "Dee", eve: "Eve" })[id] ?? "Former member"

describe("rsvpSummary", () => {
  it("groups names by answer and finds mine", () => {
    expect(rsvpSummary(attendees, "ben", names)).toEqual({
      going: ["Ana", "Dee"],
      maybe: ["Ben"],
      declined: ["Eve"],
      pending: ["Former member"],
      mine: "maybe",
    })
  })

  it("has no answer of mine when I was not invited", () => {
    expect(rsvpSummary(attendees, "zed", names).mine).toBeNull()
  })
})
