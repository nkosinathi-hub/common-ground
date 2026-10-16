import { describe, expect, it } from "vitest"
import { MEMBER_ACTIONS } from "./member-actions"

describe("member action copy", () => {
  it("says how a removed member's work is credited, as the privacy page does", () => {
    expect(MEMBER_ACTIONS.remove.description).toContain('credited to "Former member"')
    expect(MEMBER_ACTIONS.remove.title("Ben")).toBe("Remove Ben?")
  })
})
