import { describe, expect, it } from "vitest"
import { InMemoryBudget } from "../testing/in-memory-budget"
import { BudgetService } from "./budget-service"

const place = { spaceId: "s", ideaId: "i", currency: "ZAR" }
const form = { category: "Rent", label: "Deposit", estimated: "1500", actual: "1200.5" }

describe("BudgetService", () => {
  it("stores amounts as minor units on add and update", async () => {
    const budget = new BudgetService(new InMemoryBudget())
    const added = await budget.add(place, form)
    expect(added.ok && added.value).toMatchObject({ estimatedMinor: 150000, actualMinor: 120050 })
    if (!added.ok) return
    const updated = await budget.update(added.value, { ...form, actual: "0" }, "ZAR")
    expect(updated.ok && updated.value.actualMinor).toBe(0)
  })

  it("refuses an unparseable amount or a blank category before writing", async () => {
    const repo = new InMemoryBudget()
    const budget = new BudgetService(repo)
    const bad = await budget.add(place, { ...form, estimated: "abc" })
    expect(bad.ok ? null : bad.error.field).toBe("estimated")
    const added = await budget.add(place, form)
    if (!added.ok) throw new Error("add failed")
    const blank = await budget.update(added.value, { ...form, category: "" }, "ZAR")
    expect(blank.ok ? null : blank.error.field).toBe("category")
    expect(repo.rows.size).toBe(1)
  })

  it("lists an idea's lines and removes one", async () => {
    const budget = new BudgetService(new InMemoryBudget())
    const added = await budget.add(place, form)
    if (!added.ok) throw new Error("add failed")
    const listed = await budget.list("i")
    expect(listed.ok && listed.value.map((entry) => entry.id)).toEqual([added.value.id])
    expect((await budget.remove(added.value.id)).ok).toBe(true)
  })

  it("blocks a currency change while entries exist unless cleared", async () => {
    const repo = new InMemoryBudget()
    const budget = new BudgetService(repo)
    await budget.add(place, form)
    expect((await budget.changeCurrency("i", "usd", false)).ok).toBe(false)
    expect((await budget.changeCurrency("i", "usd", true)).ok).toBe(true)
    expect(repo.currency.get("i")).toBe("USD")
    expect(repo.rows.size).toBe(0)
    const bad = await budget.changeCurrency("i", "rand", true)
    expect(bad.ok ? null : bad.error.field).toBe("currency")
  })
})
