import { describe, expect, it } from "vitest"
import { FORMER_MEMBER, memberName } from "./member"

describe("memberName", () => {
  const members = [{ id: "a", displayName: "Ana" }]

  it("names current members and credits everyone else as a former member", () => {
    expect(memberName(members, "a")).toBe("Ana")
    expect(memberName(members, "gone")).toBe(FORMER_MEMBER)
    expect(memberName(members, null)).toBe(FORMER_MEMBER)
  })
})
