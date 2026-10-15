import { getContext, setContext } from "svelte"
import type { BudgetUseCases } from "../application/budget-use-cases"

const KEY = Symbol("budget")

/** Called by src/app/composition.ts with use cases bound to real adapters. */
export function provideBudget(useCases: BudgetUseCases): void {
  setContext(KEY, useCases)
}

export function useBudget(): BudgetUseCases {
  const useCases = getContext<BudgetUseCases | undefined>(KEY)
  if (!useCases) throw new Error("provideBudget was not called above this component")
  return useCases
}
