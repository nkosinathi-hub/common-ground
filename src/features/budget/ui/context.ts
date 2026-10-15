import { getContext, setContext } from "svelte"
import type { BudgetService } from "../application/budget-service"

const KEY = Symbol("budget")

export interface BudgetContext {
  readonly service: BudgetService
}

/** Called once by the composition root (src/app/composition). */
export function provideBudget(value: BudgetContext): void {
  setContext(KEY, value)
}

export function useBudget(): BudgetContext {
  const value = getContext<BudgetContext | undefined>(KEY)
  if (!value) throw new Error("Budget is not provided: call provideBudget")
  return value
}

/** The context map for render({ context }) in component tests. */
export const budgetContext = (value: BudgetContext) => new Map([[KEY, value]])
