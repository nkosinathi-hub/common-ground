import { appError, err, isCurrencyCode, type Result } from "@/shared/domain"
import { validateEntry, type BudgetEntry, type EntryForm } from "../domain"
import type { BudgetRepository } from "./ports"

/** Where a new line goes and the currency its amounts are in. */
export interface BudgetPlace {
  readonly spaceId: string
  readonly ideaId: string
  readonly currency: string
}

/** An idea's budget lines, parsed to minor units before they reach storage. */
export class BudgetService {
  constructor(private readonly repo: BudgetRepository) {}

  list = (ideaId: string) => this.repo.list(ideaId)
  remove = (id: string) => this.repo.remove(id)

  async add(place: BudgetPlace, form: EntryForm): Promise<Result<BudgetEntry>> {
    const values = validateEntry(form, place.currency)
    return values.ok ? this.repo.add(place.spaceId, place.ideaId, values.value) : values
  }

  /** Fails with kind "conflict" when someone else changed the line since base was read. */
  async update(base: BudgetEntry, form: EntryForm, currency: string): Promise<Result<BudgetEntry>> {
    const values = validateEntry(form, currency)
    return values.ok ? this.repo.update(base.id, base.updatedAt, values.value) : values
  }

  async changeCurrency(ideaId: string, code: string, clearEntries: boolean): Promise<Result<void>> {
    const currency = code.trim().toUpperCase()
    if (!isCurrencyCode(currency))
      return err(appError("validation", "Use a three-letter ISO currency code", "currency"))
    return this.repo.changeCurrency(ideaId, currency, clearEntries)
  }
}
