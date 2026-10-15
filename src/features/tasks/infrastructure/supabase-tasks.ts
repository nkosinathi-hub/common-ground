import { nextCursor, ok, PAGE_SIZE, type Cursor, type Page, type Result } from "@/shared/domain"
import type { Db } from "@/shared/infrastructure/supabase"
import type { NewTask, TaskPatch, TasksRepository } from "../application/ports"
import type { Task } from "../domain"
import { TASK_COLUMNS, taskPatchRow, toTask } from "./rows"
import { many, none, one, table } from "./table"

export class SupabaseTasks implements TasksRepository {
  constructor(private readonly db: Db) {}

  async list(ideaId: string, after: Cursor | null): Promise<Result<Page<Task>>> {
    let query = table(this.db, "tasks").select(TASK_COLUMNS).eq("idea_id", ideaId)
    if (after)
      query = query.or(
        `created_at.lt."${after.createdAt}",and(created_at.eq."${after.createdAt}",id.lt.${after.id})`,
      )
    const rows = await many(
      query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE),
      toTask,
    )
    return rows.ok ? ok({ items: rows.value, next: nextCursor(rows.value) }) : rows
  }

  create(input: NewTask) {
    const row = {
      space_id: input.spaceId,
      idea_id: input.ideaId,
      title: input.title,
      due_date: input.dueDate,
    }
    return one(
      table(this.db, "tasks")
        .insert(row as never)
        .select(TASK_COLUMNS)
        .single(),
      toTask,
    )
  }

  update(id: string, patch: TaskPatch) {
    return one(
      table(this.db, "tasks")
        .update(taskPatchRow(patch) as never)
        .eq("id", id)
        .select(TASK_COLUMNS)
        .single(),
      toTask,
    )
  }

  remove(id: string) {
    return none(table(this.db, "tasks").delete().eq("id", id))
  }
}
