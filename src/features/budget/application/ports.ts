import type { Result } from "@/shared/domain"
import type { BudgetEntry, EntryValues } from "../domain"

export interface BudgetRepository {
  /** Every entry for the idea; totals must cover all of them, so this list is not paged. */
  list(ideaId: string): Promise<Result<BudgetEntry[]>>
  add(spaceId: string, ideaId: string, values: EntryValues): Promise<Result<BudgetEntry>>
  /** Fails with kind "conflict" when the row's updated_at is no longer expectedUpdatedAt. */
  update(id: string, expectedUpdatedAt: string, values: EntryValues): Promise<Result<BudgetEntry>>
  remove(id: string): Promise<Result<void>>
  /** Refused by the server while entries exist unless clearEntries is true. */
  changeCurrency(ideaId: string, currency: string, clearEntries: boolean): Promise<Result<void>>
}
