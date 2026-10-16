import { describe, expect, it } from "vitest"
import { IDEA_STAGES, normalizeTags, TAG_MAX, validateTags, validateTitle } from "./idea"

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

  it("refuses a tag longer than 40 characters, on the tags field", () => {
    expect(validateTags(["x".repeat(TAG_MAX)])).toMatchObject({ ok: true })
    expect(validateTags(["ok", "x".repeat(TAG_MAX + 1)])).toMatchObject({
      ok: false,
      error: { kind: "validation", field: "tags", message: "Keep each tag to 40 characters" },
    })
  })
})
