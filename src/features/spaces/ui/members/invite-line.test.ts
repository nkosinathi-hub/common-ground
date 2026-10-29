import { describe, expect, it } from "vitest"
import type { Invite } from "../../domain/space"
import { canRevoke, inviteLine } from "./invite-line"

const invite: Invite = {
  id: "i",
  createdAt: "2026-10-27T10:00:00Z",
  expiresAt: "2026-11-03T10:00:00Z",
  status: "open",
  createdBy: "ben",
}

describe("invite line", () => {
  it("says when it was made, when it expires and that it is unused", () => {
    const now = Date.parse("2026-10-27T10:00:00Z")
    expect(inviteLine(invite, now)).toMatch(/27 Oct.* · Expires in 7 days · Not used yet$/)
    expect(inviteLine(invite, Date.parse("2026-11-03T09:00:00Z"))).toMatch(/Expires in 1 day ·/)
  })

  it("lets the owner revoke any link and a member only their own", () => {
    expect(canRevoke(invite, "ana", true)).toBe(true)
    expect(canRevoke(invite, "ben", false)).toBe(true)
    expect(canRevoke(invite, "cat", false)).toBe(false)
  })
})
