import { appError, err, ok, type Result } from "@/shared/domain"
import type { BudgetRepository } from "../application/ports"
import type { BudgetEntry, EntryValues } from "../domain"

/** Mirrors change_idea_currency: blocked while entries exist unless cleared. */
export class InMemoryBudget implements BudgetRepository {
  readonly rows = new Map<string, BudgetEntry>()
  readonly currency = new Map<string, string>()

  async list(ideaId: string): Promise<Result<BudgetEntry[]>> {
    return ok([...this.rows.values()].filter((e) => e.ideaId === ideaId))
  }

  async add(_spaceId: string, ideaId: string, values: EntryValues): Promise<Result<BudgetEntry>> {
    const entry = { ...values, id: `entry-${this.rows.size + 1}`, ideaId, createdAt: "" }
    this.rows.set(entry.id, entry)
    return ok(entry)
  }

  async update(id: string, values: EntryValues): Promise<Result<BudgetEntry>> {
    const found = this.rows.get(id)
    if (!found) return err(appError("not_found", "That is no longer available"))
    const entry = { ...found, ...values }
    this.rows.set(id, entry)
    return ok(entry)
  }

  async remove(id: string): Promise<Result<void>> {
    return this.rows.delete(id)
      ? ok(undefined)
      : err(appError("not_found", "That is no longer available"))
  }

  async changeCurrency(
    ideaId: string,
    currency: string,
    clearEntries: boolean,
  ): Promise<Result<void>> {
    const entries = [...this.rows.values()].filter((e) => e.ideaId === ideaId)
    if (entries.length > 0 && !clearEntries) {
      return err(appError("validation", "clear the budget entries before changing currency"))
    }
    for (const entry of entries) this.rows.delete(entry.id)
    this.currency.set(ideaId, currency)
    return ok(undefined)
  }
}
