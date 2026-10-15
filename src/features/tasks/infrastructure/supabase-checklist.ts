import type { Result } from "@/shared/domain"
import { removed, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { ChecklistRepository, NewChecklistItem } from "../application/ports"
import type { ChecklistItem } from "../domain"
import { ITEM_COLUMNS, toItem } from "./rows"

export class SupabaseChecklist implements ChecklistRepository {
  constructor(private readonly db: Db) {}

  private get items() {
    return this.db.from("task_checklist_items")
  }

  list(taskId: string): Promise<Result<ChecklistItem[]>> {
    const query = this.items.select(ITEM_COLUMNS).eq("task_id", taskId)
    return settle(query.order("position").order("id"), (data) => data.map(toItem))
  }

  add(item: NewChecklistItem): Promise<Result<ChecklistItem>> {
    const { spaceId, taskId, label, position } = item
    const row = { space_id: spaceId, task_id: taskId, label, position }
    return settle(this.items.insert(row).select(ITEM_COLUMNS).single(), toItem)
  }

  update(id: string, patch: { label?: string; done?: boolean }): Promise<Result<ChecklistItem>> {
    const query = this.items.update(patch).eq("id", id)
    return settle(query.select(ITEM_COLUMNS).single(), toItem)
  }

  remove(id: string): Promise<Result<void>> {
    return removed(this.items.delete().eq("id", id).select("id"))
  }
}
