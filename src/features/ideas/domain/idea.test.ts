import { describe, expect, it } from "vitest"
import { IDEA_STAGES, normalizeTags, validateTitle } from "./idea"

describe("idea", () => {
  it("has the seven stages in board order", () => {
    expect(IDEA_STAGES).toEqual([
      "inbox",
      "exploring",
      "planning",
      "building",
      "launched",
      "paused",
      "archived",
    ])
  })

  it("accepts a trimmed title of 1 to 200 characters", () => {
    expect(validateTitle("  Tea bar ")).toEqual({ ok: true, value: "Tea bar" })
    expect(validateTitle("   ").ok).toBe(false)
    expect(validateTitle("x".repeat(201)).ok).toBe(false)
  })

  it("normalizes tags: trimmed, lower case, unique, non-empty, at most 20", () => {
    expect(normalizeTags([" Food ", "food", "", "Pop-up"])).toEqual(["food", "pop-up"])
    expect(normalizeTags(Array.from({ length: 25 }, (_, i) => `t${i}`))).toHaveLength(20)
  })
})
