import { describe, expect, it } from "vitest"
import { chooseActiveSpace, inviteLink, inviteStatus, validateSpaceName, type Space } from "./space"
import { templateFor } from "./templates"

const space = (id: string): Space => ({ id, name: id, template: "blank", role: "member" })
const now = new Date("2026-10-15T12:00:00Z")

describe("space rules", () => {
  it("validates names", () => {
    expect(validateSpaceName("  Us ")).toEqual({ ok: true, value: "Us" })
    expect(validateSpaceName(" ").ok).toBe(false)
    expect(validateSpaceName("x".repeat(81)).ok).toBe(false)
  })

  it("derives invite status, consumed invites never look open", () => {
    const base = { redeemedAt: null, revokedAt: null, expiresAt: "2026-10-20T00:00:00Z" }
    expect(inviteStatus(base, now)).toBe("open")
    expect(inviteStatus({ ...base, redeemedAt: "2026-10-14T00:00:00Z" }, now)).toBe("used")
    expect(inviteStatus({ ...base, revokedAt: "2026-10-14T00:00:00Z" }, now)).toBe("revoked")
    expect(inviteStatus({ ...base, expiresAt: "2026-10-15T11:59:59Z" }, now)).toBe("expired")
  })

  it("builds hash invite links", () => {
    expect(inviteLink("https://x.github.io/cg/", "tok")).toBe("https://x.github.io/cg/#/invite/tok")
  })

  it("only restores a remembered space the user still belongs to", () => {
    expect(chooseActiveSpace([space("a"), space("b")], "b")?.id).toBe("b")
    expect(chooseActiveSpace([space("a")], "gone")?.id).toBe("a")
    expect(chooseActiveSpace([], "a")).toBeNull()
  })

  it("falls back to the blank template", () => {
    expect(templateFor("couple").label).toBe("Couples")
    expect(templateFor("weird").id).toBe("blank")
  })
})
