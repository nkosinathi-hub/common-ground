import { describe, expect, it } from "vitest"
import { checklistProgress, nextPosition, validateLabel, type ChecklistItem } from "./checklist"

const item = (position: number, done: boolean): ChecklistItem => ({
  id: `${position}`,
  taskId: "t",
  label: "x",
  done,
  position,
})

describe("checklist", () => {
  it("counts done items and appends after the last position", () => {
    const items = [item(0, true), item(4, false)]
    expect(checklistProgress(items)).toEqual({ done: 1, total: 2 })
    expect(nextPosition(items)).toBe(5)
    expect(nextPosition([])).toBe(0)
  })

  it("validates labels", () => {
    expect(validateLabel(" Sign ")).toEqual({ ok: true, value: "Sign" })
    expect(validateLabel(" ").ok).toBe(false)
  })
})
