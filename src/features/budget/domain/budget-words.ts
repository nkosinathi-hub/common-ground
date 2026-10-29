import { formatMoney, money, subtractMoney } from "@/shared/domain"
import type { BudgetEntry, Totals } from "./budget"

/** Categories offered first in the picker; any other word is still allowed. */
export const SUGGESTED_CATEGORIES = ["Travel", "Stay", "Food", "Tickets", "Gear", "Other"] as const

/** What the budget card says under its bar: what is left, or by how much it is over. */
export function budgetSentence(totals: Totals): { text: string; over: boolean } {
  if (totals.variance.minor > 0)
    return { text: `${formatMoney(totals.variance)} over the estimate.`, over: true }
  const left = `${formatMoney(subtractMoney(totals.estimated, totals.actual))} left against the estimate.`
  return {
    text: totals.actual.minor === 0 ? `${left} No actual spending entered yet.` : left,
    over: false,
  }
}

/** "Travel · Estimated R 1 200,00 · Actual not entered" under a line's name. */
export function entryMeta(entry: BudgetEntry, currency: string): string {
  const actual = entry.actualMinor
    ? `Actual ${formatMoney(money(entry.actualMinor, currency))}`
    : "Actual not entered"
  return [
    entry.category,
    `Estimated ${formatMoney(money(entry.estimatedMinor, currency))}`,
    actual,
  ].join(" · ")
}
