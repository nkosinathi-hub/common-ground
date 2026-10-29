import { describe, expect, it } from "vitest"
import { money } from "@/shared/domain"
import { budgetTotals, type BudgetEntry } from "./budget"
import { budgetSentence, entryMeta } from "./budget-words"

/** Intl separates thousands with a no-break space; compare words, not space kinds. */
const plain = (text: string) => text.replace(/\s/g, " ")
const line = (estimatedMinor: number, actualMinor: number) =>
  ({ id: "l", category: "Travel", label: "Campsite", estimatedMinor, actualMinor }) as BudgetEntry

describe("budget words", () => {
  it("says what is left, notes when nothing is spent yet, and flags overspend", () => {
    const left = budgetSentence(budgetTotals([line(120000, 0)], "ZAR"))
    expect(plain(left.text)).toBe(
      "R 1 200,00 left against the estimate. No actual spending entered yet.",
    )
    expect(left.over).toBe(false)
    const over = budgetSentence(budgetTotals([line(150050, 160000)], "ZAR"))
    expect([plain(over.text), over.over]).toEqual(["R 99,50 over the estimate.", true])
  })

  it("describes a line by category, estimate and actual", () => {
    expect(plain(entryMeta(line(120000, 0), "ZAR"))).toBe(
      "Travel · Estimated R 1 200,00 · Actual not entered",
    )
    expect(plain(entryMeta(line(100, 50), "ZAR"))).toBe("Travel · Estimated R 1,00 · Actual R 0,50")
    expect(money(1, "ZAR").currency).toBe("ZAR")
  })
})
