import { appError, err, isCurrencyCode } from "@/shared/domain"
import { validateEntry, type BudgetEntry, type EntryForm } from "../domain"
import type { BudgetRepository } from "./ports"

export function makeBudgetUseCases(repo: BudgetRepository) {
  return {
    list: (ideaId: string) => repo.list(ideaId),
    remove: (id: string) => repo.remove(id),

    async add(spaceId: string, ideaId: string, form: EntryForm, currency: string) {
      const values = validateEntry(form, currency)
      return values.ok ? repo.add(spaceId, ideaId, values.value) : values
    },

    async update(base: BudgetEntry, form: EntryForm, currency: string) {
      const values = validateEntry(form, currency)
      return values.ok ? repo.update(base.id, base.updatedAt, values.value) : values
    },

    async changeCurrency(ideaId: string, code: string, clearEntries: boolean) {
      const currency = code.trim().toUpperCase()
      if (!isCurrencyCode(currency))
        return err(appError("validation", "Use a three-letter ISO currency code", "currency"))
      return repo.changeCurrency(ideaId, currency, clearEntries)
    },
  }
}

export type BudgetUseCases = ReturnType<typeof makeBudgetUseCases>
