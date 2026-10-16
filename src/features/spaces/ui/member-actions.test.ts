import { describe, expect, it } from "vitest"
import { MEMBER_ACTIONS } from "./member-actions"

describe("member action copy", () => {
  it("says how a removed member's work is credited, by the one attribution rule", () => {
    const { description } = MEMBER_ACTIONS.remove
    expect(description).toContain("shows their name to anyone who still shares another space")
    expect(description).toContain('"Former member" to everyone else')
    expect(MEMBER_ACTIONS.remove.title("Ben")).toBe("Remove Ben?")
  })
})
