import type { Cursor, Page, Result } from "@/shared/domain"
import { newestFirst, pageOf } from "@/shared/infrastructure/paging"
import { current, removed, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { NewTask, TaskPatch, TasksRepository } from "../application/ports"
import type { Task, UpcomingTask } from "../domain"
import * as rows from "./rows"

export class SupabaseTasks implements TasksRepository {
  constructor(private readonly db: Db) {}

  private get tasks() {
    return this.db.from("tasks")
  }

  list(ideaId: string, after: Cursor | null): Promise<Result<Page<Task>>> {
    const query = this.tasks.select(rows.TASK_COLUMNS).eq("idea_id", ideaId)
    return settle(newestFirst(query, after), pageOf(rows.toTask))
  }

  create(input: NewTask): Promise<Result<Task>> {
    const { spaceId, ideaId, title, dueDate, status } = input
    const row = { space_id: spaceId, idea_id: ideaId, title, due_date: dueDate, status }
    return settle(this.tasks.insert(row).select(rows.TASK_COLUMNS).single(), rows.toTask)
  }

  update(id: string, patch: TaskPatch): Promise<Result<Task>> {
    const query = this.tasks.update(rows.taskPatchRow(patch)).eq("id", id)
    return settle(query.select(rows.TASK_COLUMNS).single(), rows.toTask)
  }

  save(id: string, expectedUpdatedAt: string, patch: TaskPatch): Promise<Result<Task>> {
    const query = this.tasks
      .update(rows.taskPatchRow(patch))
      .eq("id", id)
      .eq("updated_at", expectedUpdatedAt)
    return current(query.select(rows.TASK_COLUMNS), rows.toTask)
  }

  remove(id: string): Promise<Result<void>> {
    return removed(this.tasks.delete().eq("id", id).select("id"))
  }

  /** Open tasks with a due date, soonest first; the idea title comes along for the link. */
  upcoming(spaceId: string, limit: number): Promise<Result<UpcomingTask[]>> {
    const query = this.tasks
      .select(rows.UPCOMING_COLUMNS)
      .eq("space_id", spaceId)
      .neq("status", "done")
      .not("due_date", "is", null)
      .order("due_date")
      .order("title")
      .limit(limit)
    return settle(query, (data) => data.map(rows.toUpcoming))
  }
}
