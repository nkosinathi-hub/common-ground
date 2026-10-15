import { appError, err, ok, type Result } from "@/shared/domain"
import type { Tables } from "@/shared/infrastructure/database.types"
import { removed, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { BudgetRepository } from "../application/ports"
import type { BudgetEntry, EntryValues } from "../domain"

type EntryRow = Omit<Tables<"budget_entries">, "space_id" | "created_by">

const STALE = "Someone else changed this. Reload to see their version"
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

/** The update matched on the updated_at the client saw: no row back means it went stale. */
const current = (rows: EntryRow[]): Result<BudgetEntry> => {
  const [row] = rows
  return row ? ok(toEntry(row)) : err(appError("conflict", STALE))
}

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

  async update(
    id: string,
    expectedUpdatedAt: string,
    values: EntryValues,
  ): Promise<Result<BudgetEntry>> {
    const query = this.entries
      .update(toRow(values))
      .eq("id", id)
      .eq("updated_at", expectedUpdatedAt)
    const rows = await settle(query.select(ENTRY_COLUMNS), (data) => data)
    return rows.ok ? current(rows.value) : rows
  }

  remove(id: string): Promise<Result<void>> {
    return removed(this.entries.delete().eq("id", id).select("id"))
  }

  changeCurrency(ideaId: string, currency: string, clearEntries: boolean): Promise<Result<void>> {
    const args = { idea: ideaId, new_currency: currency, clear_entries: clearEntries }
    return settle(this.db.rpc("change_idea_currency", args), () => undefined)
  }
}
