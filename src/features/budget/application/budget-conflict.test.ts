import { describe, expect, it } from "vitest"
import { InMemoryBudget } from "../testing/in-memory-budget"
import { makeBudgetUseCases } from "./budget-use-cases"

const form = { category: "Rent", label: "Deposit", estimated: "1500", actual: "" }

async function setup() {
  const budget = makeBudgetUseCases(new InMemoryBudget())
  const added = await budget.add("s", "i", form, "ZAR")
  if (!added.ok) throw new Error("add failed")
  return { budget, base: added.value }
}

describe("budget line edits check the version the client saw", () => {
  it("carries updatedAt and moves it forward on each edit", async () => {
    const { budget, base } = await setup()
    expect(base.updatedAt).not.toBe("")
    const edited = await budget.update(base, { ...form, label: "Bond", actual: "10" }, "ZAR")
    expect(edited.ok && edited.value).toMatchObject({ label: "Bond", actualMinor: 1000 })
    expect(edited.ok && edited.value.updatedAt).not.toBe(base.updatedAt)
  })

  it("refuses an edit made from a stale copy with a conflict", async () => {
    const { budget, base } = await setup()
    expect((await budget.update(base, { ...form, label: "Theirs" }, "ZAR")).ok).toBe(true)
    const stale = await budget.update(base, { ...form, label: "Mine" }, "ZAR")
    expect(stale.ok ? null : stale.error.kind).toBe("conflict")
    const listed = await budget.list("i")
    expect(listed.ok && listed.value[0]?.label).toBe("Theirs")
  })
})
