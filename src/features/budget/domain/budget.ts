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

export const CURRENCIES = [
  "ZAR",
  "USD",
  "EUR",
  "GBP",
  "BWP",
  "NAD",
  "KES",
  "NGN",
  "AUD",
  "CAD",
] as const

export interface Totals {
  readonly estimated: Money
  readonly actual: Money
  /** actual minus estimated: positive means over budget. */
  readonly variance: Money
}

function totals(entries: readonly BudgetEntry[], currency: string): Totals {
  const zero = money(0, currency)
  const estimated = entries.reduce(
    (sum, e) => addMoney(sum, money(e.estimatedMinor, currency)),
    zero,
  )
  const actual = entries.reduce((sum, e) => addMoney(sum, money(e.actualMinor, currency)), zero)
  return { estimated, actual, variance: subtractMoney(actual, estimated) }
}

export const budgetSummary = totals

export function totalsByCategory(entries: readonly BudgetEntry[], currency: string) {
  const categories = [...new Set(entries.map((e) => e.category))].sort()
  return categories.map((category) => ({
    category,
    ...totals(
      entries.filter((e) => e.category === category),
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
  if (category.length < 1 || category.length > 80)
    return err(appError("validation", "Choose a category", "category"))
  if (label.length < 1 || label.length > 200)
    return err(appError("validation", "Describe the line item", "label"))
  const estimated = amount(form.estimated, currency, "estimated")
  if (!estimated.ok) return estimated
  const actual = amount(form.actual, currency, "actual")
  if (!actual.ok) return actual
  return ok({ category, label, estimatedMinor: estimated.value, actualMinor: actual.value })
}
