import { removed, settle, type QueryReply } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { BudgetRepository } from "../application/ports"
import type { BudgetEntry, EntryValues } from "../domain"

type Row = Record<string, unknown>
const COLUMNS = "id, idea_id, category, label, estimated_minor, actual_minor, created_at"

const toEntry = (r: Row): BudgetEntry => ({
  id: r.id as string,
  ideaId: r.idea_id as string,
  category: r.category as string,
  label: r.label as string,
  estimatedMinor: Number(r.estimated_minor),
  actualMinor: Number(r.actual_minor),
  createdAt: r.created_at as string,
})
const toRow = (v: EntryValues) => ({
  category: v.category,
  label: v.label,
  estimated_minor: v.estimatedMinor,
  actual_minor: v.actualMinor,
})

export class SupabaseBudget implements BudgetRepository {
  constructor(private readonly db: Db) {}

  // budget_entries enters the generated Database type only after `pnpm db:types`.
  private table() {
    return (this.db as unknown as { from: (t: string) => ReturnType<Db["from"]> }).from(
      "budget_entries",
    )
  }

  list(ideaId: string) {
    const query = this.table()
      .select(COLUMNS)
      .eq("idea_id", ideaId)
      .order("category")
      .order("created_at")
    return settle(query, (rows) => (rows as Row[]).map(toEntry))
  }

  add(spaceId: string, ideaId: string, values: EntryValues) {
    const row = { space_id: spaceId, idea_id: ideaId, ...toRow(values) }
    return settle(
      this.table()
        .insert(row as never)
        .select(COLUMNS)
        .single(),
      (r) => toEntry(r as Row),
    )
  }

  update(id: string, values: EntryValues) {
    return settle(
      this.table()
        .update(toRow(values) as never)
        .eq("id", id)
        .select(COLUMNS)
        .single(),
      (r) => toEntry(r as Row),
    )
  }

  remove(id: string) {
    return removed(this.table().delete().eq("id", id).select("id"))
  }

  changeCurrency(ideaId: string, currency: string, clearEntries: boolean) {
    const rpc = (
      this.db as unknown as { rpc: (fn: string, args: object) => PromiseLike<QueryReply> }
    ).rpc
    return settle(
      rpc.call(this.db, "change_idea_currency", {
        idea: ideaId,
        new_currency: currency,
        clear_entries: clearEntries,
      }),
      () => undefined,
    )
  }
}
