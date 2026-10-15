import type { DateOnly } from "@/shared/domain"
import type { TaskPatch } from "../application/ports"
import type {
  ChecklistItem,
  Milestone,
  Task,
  TaskPriority,
  TaskStatus,
  UpcomingTask,
} from "../domain"

type Row = Record<string, unknown>
const s = (v: unknown) => v as string
const n = (v: unknown) => (v ?? null) as string | null

export const TASK_COLUMNS =
  "id, space_id, idea_id, title, description, status, priority, due_date, assignee_id, milestone_id, created_at, updated_at"
export const UPCOMING_COLUMNS = "id, idea_id, title, status, due_date, ideas(title)"
export const ITEM_COLUMNS = "id, task_id, label, done, position"
export const MILESTONE_COLUMNS =
  "id, space_id, idea_id, title, target_date, completed_at, updated_at"

export const toTask = (r: Row): Task => ({
  id: s(r.id),
  spaceId: s(r.space_id),
  ideaId: s(r.idea_id),
  title: s(r.title),
  description: s(r.description),
  status: r.status as TaskStatus,
  priority: r.priority as TaskPriority,
  dueDate: n(r.due_date) as DateOnly | null,
  assigneeId: n(r.assignee_id),
  milestoneId: n(r.milestone_id),
  createdAt: s(r.created_at),
  updatedAt: s(r.updated_at),
})

export const toItem = (r: Row): ChecklistItem => ({
  id: s(r.id),
  taskId: s(r.task_id),
  label: s(r.label),
  done: Boolean(r.done),
  position: Number(r.position),
})

export const toMilestone = (r: Row): Milestone => ({
  id: s(r.id),
  spaceId: s(r.space_id),
  ideaId: s(r.idea_id),
  title: s(r.title),
  targetDate: n(r.target_date) as DateOnly | null,
  completedAt: n(r.completed_at),
  updatedAt: s(r.updated_at),
})

const KEYS: Record<keyof TaskPatch, string> = {
  title: "title",
  description: "description",
  status: "status",
  priority: "priority",
  dueDate: "due_date",
  assigneeId: "assignee_id",
  milestoneId: "milestone_id",
}

export const taskPatchRow = (patch: TaskPatch): Row =>
  Object.fromEntries(Object.entries(patch).map(([k, v]) => [KEYS[k as keyof TaskPatch], v]))

export const toUpcoming = (r: Row): UpcomingTask => ({
  id: s(r.id),
  ideaId: s(r.idea_id),
  ideaTitle: (r.ideas as { title?: string } | null)?.title ?? "",
  title: s(r.title),
  status: r.status as TaskStatus,
  dueDate: s(r.due_date) as DateOnly,
})
