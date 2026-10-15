import { describe, expect, it } from "vitest"
import { InMemoryBudget } from "../testing/in-memory-budget"
import { makeBudgetUseCases } from "./budget-use-cases"

const form = { category: "Rent", label: "Deposit", estimated: "1500", actual: "1200.5" }

describe("budget use cases", () => {
  it("stores amounts as minor units", async () => {
    const budget = makeBudgetUseCases(new InMemoryBudget())
    const added = await budget.add("s", "i", form, "ZAR")
    expect(added.ok && added.value).toMatchObject({ estimatedMinor: 150000, actualMinor: 120050 })
    if (!added.ok) return
    const updated = await budget.update(added.value, { ...form, actual: "0" }, "ZAR")
    expect(updated.ok && updated.value.actualMinor).toBe(0)
    expect((await budget.add("s", "i", { ...form, estimated: "abc" }, "ZAR")).ok).toBe(false)
  })

  it("blocks a currency change while entries exist unless cleared", async () => {
    const repo = new InMemoryBudget()
    const budget = makeBudgetUseCases(repo)
    await budget.add("s", "i", form, "ZAR")
    expect((await budget.changeCurrency("i", "usd", false)).ok).toBe(false)
    expect((await budget.changeCurrency("i", "usd", true)).ok).toBe(true)
    expect(repo.currency.get("i")).toBe("USD")
    expect(repo.rows.size).toBe(0)
    const bad = await budget.changeCurrency("i", "rand", true)
    expect(bad.ok ? null : bad.error.field).toBe("currency")
  })
})
