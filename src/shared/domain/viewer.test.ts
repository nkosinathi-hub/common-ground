import { describe, expect, it } from "vitest"
import { canDelete } from "./viewer"

describe("canDelete", () => {
  const member = { me: "u1", isOwner: false }

  it("lets the author delete their own work", () => {
    expect(canDelete("u1", member)).toBe(true)
  })

  it("refuses another member's work, or work whose author left", () => {
    expect(canDelete("u2", member)).toBe(false)
    expect(canDelete(null, member)).toBe(false)
    expect(canDelete(null, { me: "", isOwner: false })).toBe(false)
  })

  it("lets the space owner delete anything", () => {
    expect(canDelete("u2", { me: "u1", isOwner: true })).toBe(true)
    expect(canDelete(null, { me: "u1", isOwner: true })).toBe(true)
  })
})
