import { describe, expect, it } from "vitest"
import { InMemoryBudget } from "../testing/in-memory-budget"
import { makeBudgetUseCases } from "./budget-use-cases"

describe("budget use cases, edges", () => {
  it("lists, refuses an invalid update and removes", async () => {
    const budget = makeBudgetUseCases(new InMemoryBudget())
    const added = await budget.add(
      "s",
      "i",
      { category: "Rent", label: "x", estimated: "1", actual: "" },
      "ZAR",
    )
    if (!added.ok) throw new Error("add failed")
    const bad = await budget.update(
      added.value.id,
      { category: "", label: "x", estimated: "1", actual: "" },
      "ZAR",
    )
    expect(bad.ok).toBe(false)
    expect((await budget.list("i")).ok && (await budget.list("i"))).toMatchObject({
      value: [{ id: added.value.id }],
    })
    expect((await budget.remove(added.value.id)).ok).toBe(true)
  })
})
