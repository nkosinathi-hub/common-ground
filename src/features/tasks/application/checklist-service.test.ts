import { describe, expect, it } from "vitest"
import { InMemoryChecklist } from "../testing/in-memory-plans"
import { ChecklistService } from "./checklist-service"

const task = { id: "t", spaceId: "s" }

describe("ChecklistService", () => {
  it("adds items after the existing ones and toggles them", async () => {
    const checklist = new ChecklistService(new InMemoryChecklist())
    const first = await checklist.add(task, "Sign", [])
    if (!first.ok) throw new Error("add failed")
    const second = await checklist.add(task, " Pay deposit ", [first.value])
    expect(second.ok && second.value.position).toBe(first.value.position + 1)
    await checklist.toggle(first.value.id, true)
    const items = await checklist.list("t")
    expect(items.ok && items.value.map((item) => [item.label, item.done])).toEqual([
      ["Sign", true],
      ["Pay deposit", false],
    ])
  })

  it("refuses a blank label and removes items", async () => {
    const checklist = new ChecklistService(new InMemoryChecklist())
    const blank = await checklist.add(task, " ", [])
    expect(blank.ok ? null : blank.error.field).toBe("label")
    const item = await checklist.add(task, "Sign", [])
    if (!item.ok) throw new Error("add failed")
    expect((await checklist.remove(item.value.id)).ok).toBe(true)
    expect((await checklist.remove(item.value.id)).ok).toBe(false)
  })
})
