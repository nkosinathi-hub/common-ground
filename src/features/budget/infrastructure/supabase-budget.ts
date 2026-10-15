import type { Result } from "@/shared/domain"
import type { Tables } from "@/shared/infrastructure/database.types"
import { current, removed, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { BudgetRepository } from "../application/ports"
import type { BudgetEntry, EntryValues } from "../domain"

type EntryRow = Omit<Tables<"budget_entries">, "space_id" | "created_by">

export const ENTRY_COLUMNS =
  "id, idea_id, category, label, estimated_minor, actual_minor, created_at, updated_at"

const toEntry = (row: EntryRow): BudgetEntry => ({
  id: row.id,
  ideaId: row.idea_id,
  category: row.category,
  label: row.label,
  estimatedMinor: row.estimated_minor,
  actualMinor: row.actual_minor,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toRow = (values: EntryValues) => ({
  category: values.category,
  label: values.label,
  estimated_minor: values.estimatedMinor,
  actual_minor: values.actualMinor,
})

export class SupabaseBudget implements BudgetRepository {
  constructor(private readonly db: Db) {}

  private get entries() {
    return this.db.from("budget_entries")
  }

  list(ideaId: string): Promise<Result<BudgetEntry[]>> {
    const query = this.entries.select(ENTRY_COLUMNS).eq("idea_id", ideaId)
    return settle(query.order("category").order("created_at"), (rows) => rows.map(toEntry))
  }

  add(spaceId: string, ideaId: string, values: EntryValues): Promise<Result<BudgetEntry>> {
    const row = { space_id: spaceId, idea_id: ideaId, ...toRow(values) }
    return settle(this.entries.insert(row).select(ENTRY_COLUMNS).single(), toEntry)
  }

  update(id: string, expectedUpdatedAt: string, values: EntryValues): Promise<Result<BudgetEntry>> {
    const query = this.entries
      .update(toRow(values))
      .eq("id", id)
      .eq("updated_at", expectedUpdatedAt)
    return current(query.select(ENTRY_COLUMNS), toEntry)
  }

  remove(id: string): Promise<Result<void>> {
    return removed(this.entries.delete().eq("id", id).select("id"))
  }

  changeCurrency(ideaId: string, currency: string, clearEntries: boolean): Promise<Result<void>> {
    const args = { idea: ideaId, new_currency: currency, clear_entries: clearEntries }
    return settle(this.db.rpc("change_idea_currency", args), () => undefined)
  }
}
