import type { BudgetEntry, EntryForm } from "./budget"

/** Minor units as the plain decimal text the entry inputs accept, e.g. 150050 -> "1500.50". */
export function amountText(minor: number): string {
  const cents = String(minor % 100).padStart(2, "0")
  return `${Math.floor(minor / 100)}.${cents}`
}

/** The form an inline edit starts from. */
export const entryFormOf = (entry: BudgetEntry): EntryForm => ({
  category: entry.category,
  label: entry.label,
  estimated: amountText(entry.estimatedMinor),
  actual: amountText(entry.actualMinor),
})
