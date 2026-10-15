import { describe, expect, it } from "vitest"
import { canDelete, canEdit, isConcealed, MAX_BODY, validateBody, type Comment } from "./comment"

const comment = (over: Partial<Comment> = {}): Comment => ({
  id: "c1",
  spaceId: "s",
  parent: { kind: "watch", id: "w" },
  authorId: "ana",
  body: "Hello",
  spoiler: false,
  edited: false,
  mentionIds: [],
  createdAt: "2026-10-15T10:00:00Z",
  ...over,
})

describe("comment rules", () => {
  it("trims and bounds the body", () => {
    expect(validateBody("  hi  ")).toEqual({ ok: true, value: "hi" })
    expect(validateBody("   ")).toMatchObject({ ok: false, error: { field: "body" } })
    expect(validateBody("x".repeat(MAX_BODY)).ok).toBe(true)
    expect(validateBody("x".repeat(MAX_BODY + 1)).ok).toBe(false)
  })

  it("lets authors edit and authors or owners delete", () => {
    expect(canEdit(comment(), "ana")).toBe(true)
    expect(canEdit(comment(), "ben")).toBe(false)
    expect(canEdit(comment({ authorId: null }), "ben")).toBe(false)
    expect(canDelete(comment(), "ana", false)).toBe(true)
    expect(canDelete(comment(), "ben", false)).toBe(false)
    expect(canDelete(comment(), "ben", true)).toBe(true)
  })

  it("conceals spoilers until revealed", () => {
    expect(isConcealed(comment(), new Set())).toBe(false)
    expect(isConcealed(comment({ spoiler: true }), new Set())).toBe(true)
    expect(isConcealed(comment({ spoiler: true }), new Set(["c1"]))).toBe(false)
  })
})
