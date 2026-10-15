import { describe, expect, it } from "vitest"
import { BRIEF_FIELDS, changedFields, cleanBrief } from "./brief"

describe("brief", () => {
  it("has the eight overview fields", () => {
    expect(BRIEF_FIELDS).toHaveLength(8)
    expect(BRIEF_FIELDS).toContain("valueProposition")
  })

  it("drops blank fields and rejects text over 4000 characters", () => {
    expect(cleanBrief({ pitch: " Hi ", problem: "  " })).toEqual({
      ok: true,
      value: { pitch: "Hi" },
    })
    const long = cleanBrief({ solution: "x".repeat(4001) })
    expect(long.ok ? null : long.error.field).toBe("solution")
  })

  it("lists fields that differ between two versions", () => {
    expect(changedFields({ pitch: "a", nextStep: "b" }, { pitch: "a", problem: "c" })).toEqual([
      "problem",
      "nextStep",
    ])
  })
})
