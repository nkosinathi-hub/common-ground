import { describe, expect, it } from "vitest"
import { InMemoryMilestones } from "../testing/in-memory-plans"
import { MilestonesService } from "./milestones-service"

const NOW = new Date("2026-10-15T08:00:00Z")

async function setup() {
  const milestones = new MilestonesService(new InMemoryMilestones(), () => NOW)
  const added = await milestones.add(
    { spaceId: "s", ideaId: "i" },
    { title: "Open", targetDate: null },
  )
  if (!added.ok) throw new Error("add failed")
  return { milestones, base: added.value }
}

describe("MilestonesService", () => {
  it("completes at the injected clock's time and reopens", async () => {
    const { milestones, base } = await setup()
    const done = await milestones.complete(base, true)
    expect(done.ok && done.value.completedAt).toBe("2026-10-15T08:00:00.000Z")
    if (!done.ok) return
    const reopened = await milestones.complete(done.value, false)
    expect(reopened.ok && reopened.value.completedAt).toBeNull()
  })

  it("retargets and moves updatedAt forward on each edit", async () => {
    const { milestones, base } = await setup()
    expect(base.updatedAt).not.toBe("")
    const edited = await milestones.retarget(base, { title: "Launch", targetDate: "2027-01-01" })
    expect(edited.ok && edited.value).toMatchObject({ title: "Launch", targetDate: "2027-01-01" })
    expect(edited.ok && edited.value.updatedAt).not.toBe(base.updatedAt)
  })

  it("refuses an edit made from a stale copy with a conflict", async () => {
    const { milestones, base } = await setup()
    expect((await milestones.complete(base, true)).ok).toBe(true)
    const stale = await milestones.retarget(base, { title: "Mine", targetDate: null })
    expect(stale.ok ? null : stale.error.kind).toBe("conflict")
    const reopen = await milestones.complete(base, false)
    expect(reopen.ok ? null : reopen.error.kind).toBe("conflict")
  })

  it("validates before it writes, lists and removes", async () => {
    const { milestones, base } = await setup()
    const untitled = await milestones.add(
      { spaceId: "s", ideaId: "i" },
      { title: "", targetDate: null },
    )
    expect(untitled.ok ? null : untitled.error.field).toBe("title")
    const bad = await milestones.retarget(base, { title: "Open", targetDate: "bad" })
    expect(bad.ok ? null : bad.error.field).toBe("targetDate")
    const listed = await milestones.list("i")
    expect(listed.ok && listed.value).toHaveLength(1)
    expect((await milestones.remove(base.id)).ok).toBe(true)
  })
})
