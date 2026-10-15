import { describe, expect, it } from "vitest"
import {
  budgetSummary,
  CURRENCIES,
  totalsByCategory,
  validateEntry,
  type BudgetEntry,
} from "./budget"

const entry = (category: string, estimated: number, actual: number): BudgetEntry => ({
  id: category + estimated,
  ideaId: "i",
  updatedAt: "",
  category,
  label: "x",
  estimatedMinor: estimated,
  actualMinor: actual,
  createdAt: "",
})

describe("budget money arithmetic", () => {
  it("totals estimated and actual in minor units without float drift", () => {
    const entries = [entry("Rent", 10, 20), entry("Rent", 20, 10), entry("Stock", 1, 0)]
    const summary = budgetSummary(entries, "ZAR")
    expect(summary.estimated).toEqual({ minor: 31, currency: "ZAR" })
    expect(summary.actual).toEqual({ minor: 30, currency: "ZAR" })
    expect(summary.variance).toEqual({ minor: -1, currency: "ZAR" })
  })

  it("reports overspend as positive variance", () => {
    expect(budgetSummary([entry("Rent", 100_00, 150_50)], "ZAR").variance.minor).toBe(50_50)
  })

  it("handles an empty budget", () => {
    expect(budgetSummary([], "USD").variance).toEqual({ minor: 0, currency: "USD" })
  })

  it("groups totals per category", () => {
    const rows = totalsByCategory(
      [entry("Rent", 10, 5), entry("Stock", 3, 4), entry("Rent", 1, 1)],
      "ZAR",
    )
    expect(
      rows.map((r) => [r.category, r.estimated.minor, r.actual.minor, r.variance.minor]),
    ).toEqual([
      ["Rent", 11, 6, -5],
      ["Stock", 3, 4, 1],
    ])
  })
})

describe("validateEntry", () => {
  it("parses decimal amounts into minor units", () => {
    const result = validateEntry(
      { category: " Rent ", label: "Deposit", estimated: "1 500.50", actual: "" },
      "ZAR",
    )
    expect(result).toEqual({
      ok: true,
      value: { category: "Rent", label: "Deposit", estimatedMinor: 150050, actualMinor: 0 },
    })
  })

  it("rejects negative or malformed amounts against the right field", () => {
    const negative = validateEntry(
      { category: "Rent", label: "x", estimated: "-5", actual: "" },
      "ZAR",
    )
    expect(negative.ok ? null : negative.error.field).toBe("estimated")
    const bad = validateEntry(
      { category: "Rent", label: "x", estimated: "1", actual: "1.234" },
      "ZAR",
    )
    expect(bad.ok ? null : bad.error.field).toBe("actual")
    expect(validateEntry({ category: "", label: "x", estimated: "1", actual: "" }, "ZAR").ok).toBe(
      false,
    )
  })

  it("offers ZAR first", () => {
    expect(CURRENCIES[0]).toBe("ZAR")
  })
})
