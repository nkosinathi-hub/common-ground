import { appError, err, ok, type Result } from "@/shared/domain"
import type { BudgetRepository } from "../application/ports"
import type { BudgetEntry, EntryValues } from "../domain"

/**
 * Mirrors change_idea_currency (blocked while entries exist unless cleared) and the adapter's
 * updated_at precondition (a stale edit fails with kind "conflict").
 */
export class InMemoryBudget implements BudgetRepository {
  readonly rows = new Map<string, BudgetEntry>()
  readonly currency = new Map<string, string>()
  /** Who the next lines are written by. */
  author: string | null = null
  private tick = 0
  private stamp() {
    this.tick += 1
    return new Date(Date.UTC(2026, 9, 15, 2, 0, this.tick)).toISOString()
  }

  async list(ideaId: string): Promise<Result<BudgetEntry[]>> {
    return ok([...this.rows.values()].filter((e) => e.ideaId === ideaId))
  }

  async add(_spaceId: string, ideaId: string, values: EntryValues): Promise<Result<BudgetEntry>> {
    const stamp = this.stamp()
    const entry = {
      ...values,
      id: `entry-${this.tick}`,
      ideaId,
      createdBy: this.author,
      createdAt: stamp,
      updatedAt: stamp,
    }
    this.rows.set(entry.id, entry)
    return ok(entry)
  }

  async update(id: string, expected: string, values: EntryValues): Promise<Result<BudgetEntry>> {
    const found = this.rows.get(id)
    if (!found) return err(appError("not_found", "That is no longer available"))
    if (found.updatedAt !== expected) return err(appError("conflict", "Changed elsewhere"))
    const entry = { ...found, ...values, updatedAt: this.stamp() }
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
