import { describe, expect, it } from "vitest"
import { milestoneProgress, validateMilestone, type Milestone } from "./milestone"

describe("milestone", () => {
  it("validates title and target date", () => {
    expect(validateMilestone({ title: " Launch ", targetDate: "2026-12-01" })).toEqual({
      ok: true,
      value: { title: "Launch", targetDate: "2026-12-01" },
    })
    expect(validateMilestone({ title: "Launch", targetDate: null }).ok).toBe(true)
    expect(validateMilestone({ title: "", targetDate: null }).ok).toBe(false)
    const bad = validateMilestone({ title: "x", targetDate: "12/01/2026" })
    expect(bad.ok ? null : bad.error.field).toBe("targetDate")
  })

  it("counts completed milestones", () => {
    const m = (completedAt: string | null) => ({ completedAt }) as Milestone
    expect(milestoneProgress([m("2026-10-15T00:00:00Z"), m(null)])).toEqual({ done: 1, total: 2 })
  })
})
