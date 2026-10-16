import { describe, expect, it } from "vitest"
import { draftLabel } from "./draft"

describe("draftLabel", () => {
  const now = new Date("2026-10-16T12:00:00Z")
  it("names who it is for and when it was last edited", () => {
    expect(draftLabel({ recipientName: "Ben", updatedAt: "2026-10-16T10:00:00Z" }, now)).toBe(
      "To Ben · edited 2h ago",
    )
    expect(draftLabel({ recipientName: null, updatedAt: "2026-10-16T12:00:00Z" }, now)).toBe(
      "No one chosen yet · edited just now",
    )
  })
})
