import {
  addMoney,
  appError,
  err,
  money,
  ok,
  parseMoney,
  subtractMoney,
  type Money,
  type Result,
} from "@/shared/domain"

export interface BudgetEntry {
  readonly id: string
  readonly ideaId: string
  readonly category: string
  readonly label: string
  readonly estimatedMinor: number
  readonly actualMinor: number
  readonly createdAt: string
  /** Exact server timestamp string; edits send it back as their precondition. */
  readonly updatedAt: string
}

export interface EntryValues {
  readonly category: string
  readonly label: string
  readonly estimatedMinor: number
  readonly actualMinor: number
}

export interface EntryForm {
  readonly category: string
  readonly label: string
  readonly estimated: string
  readonly actual: string
}

/** Longest category and line label, in characters. */
export const CATEGORY_MAX = 80
export const LABEL_MAX = 200

export interface Totals {
  readonly estimated: Money
  readonly actual: Money
  /** actual minus estimated: positive means over budget. */
  readonly variance: Money
}

/** Estimated, actual and variance across the given lines, in the idea's currency. */
export function budgetTotals(entries: readonly BudgetEntry[], currency: string): Totals {
  const zero = money(0, currency)
  const estimated = entries.reduce(
    (sum, entry) => addMoney(sum, money(entry.estimatedMinor, currency)),
    zero,
  )
  const actual = entries.reduce(
    (sum, entry) => addMoney(sum, money(entry.actualMinor, currency)),
    zero,
  )
  return { estimated, actual, variance: subtractMoney(actual, estimated) }
}

export function totalsByCategory(entries: readonly BudgetEntry[], currency: string) {
  const categories = [...new Set(entries.map((entry) => entry.category))].sort()
  return categories.map((category) => ({
    category,
    ...budgetTotals(
      entries.filter((entry) => entry.category === category),
      currency,
    ),
  }))
}

function amount(input: string, currency: string, field: string): Result<number> {
  if (input.trim() === "") return ok(0)
  const parsed = parseMoney(input, currency)
  return parsed.ok ? ok(parsed.value.minor) : err({ ...parsed.error, field })
}

export function validateEntry(form: EntryForm, currency: string): Result<EntryValues> {
  const category = form.category.trim()
  const label = form.label.trim()
  if (category.length < 1 || category.length > CATEGORY_MAX)
    return err(appError("validation", "Choose a category", "category"))
  if (label.length < 1 || label.length > LABEL_MAX)
    return err(appError("validation", "Describe the line item", "label"))
  const estimated = amount(form.estimated, currency, "estimated")
  if (!estimated.ok) return estimated
  const actual = amount(form.actual, currency, "actual")
  if (!actual.ok) return actual
  return ok({ category, label, estimatedMinor: estimated.value, actualMinor: actual.value })
}
