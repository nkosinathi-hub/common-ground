import { removed } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { ChecklistRepository } from "../application/ports"
import { ITEM_COLUMNS, toItem } from "./rows"
import { many, one, table } from "./table"

export class SupabaseChecklist implements ChecklistRepository {
  constructor(private readonly db: Db) {}
  list(taskId: string) {
    return many(
      table(this.db, "task_checklist_items")
        .select(ITEM_COLUMNS)
        .eq("task_id", taskId)
        .order("position")
        .order("id"),
      toItem,
    )
  }
  add(spaceId: string, taskId: string, label: string, position: number) {
    const row = { space_id: spaceId, task_id: taskId, label, position }
    return one(
      table(this.db, "task_checklist_items")
        .insert(row as never)
        .select(ITEM_COLUMNS)
        .single(),
      toItem,
    )
  }
  update(id: string, patch: { label?: string; done?: boolean }) {
    return one(
      table(this.db, "task_checklist_items")
        .update(patch as never)
        .eq("id", id)
        .select(ITEM_COLUMNS)
        .single(),
      toItem,
    )
  }
  remove(id: string) {
    return removed(table(this.db, "task_checklist_items").delete().eq("id", id).select("id"))
  }
}
