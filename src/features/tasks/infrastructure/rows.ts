import type { DateOnly } from "@/shared/domain"
import type { Tables } from "@/shared/infrastructure/database.types"
import type { TaskPatch } from "../application/ports"
import type { ChecklistItem, Milestone, Task, UpcomingTask } from "../domain"

type TaskTable = Tables<"tasks">
export type TaskRow = TaskTable
export type UpcomingRow = Pick<
  TaskTable,
  "id" | "idea_id" | "title" | "status" | "due_date" | "priority"
> & {
  readonly ideas: { readonly title: string } | null
  readonly assignee: { readonly display_name: string } | null
}
export type ItemRow = Pick<
  Tables<"task_checklist_items">,
  "id" | "task_id" | "label" | "done" | "position" | "created_by"
>
export type MilestoneRow = Omit<Tables<"milestones">, "created_at">

export const TASK_COLUMNS =
  "id, space_id, idea_id, title, description, status, priority, due_date, assignee_id, milestone_id, created_by, created_at, updated_at"
export const UPCOMING_COLUMNS =
  "id, idea_id, title, status, due_date, priority, ideas(title), assignee:profiles!assignee_id(display_name)"
export const ITEM_COLUMNS = "id, task_id, label, done, position, created_by"
export const MILESTONE_COLUMNS =
  "id, space_id, idea_id, title, target_date, completed_at, created_by, updated_at"

// due_date and target_date are Postgres date columns: always YYYY-MM-DD, so DateOnly holds.
const dateOnly = (value: string | null) => value as DateOnly | null

export const toTask = (row: TaskRow): Task => ({
  id: row.id,
  spaceId: row.space_id,
  ideaId: row.idea_id,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  dueDate: dateOnly(row.due_date),
  assigneeId: row.assignee_id,
  milestoneId: row.milestone_id,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const toItem = (row: ItemRow): ChecklistItem => ({
  id: row.id,
  taskId: row.task_id,
  label: row.label,
  done: row.done,
  position: row.position,
  createdBy: row.created_by,
})

export const toMilestone = (row: MilestoneRow): Milestone => ({
  id: row.id,
  spaceId: row.space_id,
  ideaId: row.idea_id,
  title: row.title,
  targetDate: dateOnly(row.target_date),
  completedAt: row.completed_at,
  createdBy: row.created_by,
  updatedAt: row.updated_at,
})

/** The upcoming query filters out null due dates, so every row has one. */
export const toUpcoming = (row: UpcomingRow): UpcomingTask => ({
  id: row.id,
  ideaId: row.idea_id,
  ideaTitle: row.ideas?.title ?? "",
  title: row.title,
  status: row.status,
  dueDate: row.due_date as DateOnly,
  priority: row.priority,
  assigneeName: row.assignee?.display_name ?? null,
})

export const taskPatchRow = (patch: TaskPatch) => ({
  title: patch.title,
  description: patch.description,
  status: patch.status,
  priority: patch.priority,
  due_date: patch.dueDate,
  assignee_id: patch.assigneeId,
  milestone_id: patch.milestoneId,
})
