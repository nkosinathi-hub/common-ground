import { appError, err, ok, toDateOnly, type DateOnly, type Result } from "@/shared/domain"
import type { Task, TaskPriority, TaskStatus } from "./task"
import { validateTaskInput } from "./task"

export const DESCRIPTION_MAX = 4000

/** Everything the task editor (S08) saves in one go. */
export interface TaskDraft {
  readonly title: string
  readonly description: string
  readonly status: TaskStatus
  readonly priority: TaskPriority
  readonly dueDate: string | null
  readonly assigneeId: string | null
  readonly milestoneId: string | null
}

export type ValidTaskDraft = Omit<TaskDraft, "dueDate"> & { readonly dueDate: DateOnly | null }

export function validateTaskDraft(draft: TaskDraft): Result<ValidTaskDraft> {
  const base = validateTaskInput({ title: draft.title, dueDate: null })
  if (!base.ok) return base
  const description = draft.description.trim()
  if (description.length > DESCRIPTION_MAX)
    return err(
      appError(
        "validation",
        `Keep the description under ${DESCRIPTION_MAX} characters`,
        "description",
      ),
    )
  const due = draft.dueDate ? toDateOnly(draft.dueDate) : ok(null)
  if (!due.ok) return err({ ...due.error, field: "dueDate" })
  return ok({ ...draft, title: base.value.title, description, dueDate: due.value })
}

/** The list's filters (D08): each one narrows; absent means any. */
export interface TaskFilter {
  readonly assignee?: string | null
  readonly priority?: TaskPriority | null
  readonly milestone?: string | null
}

export const filterTasks = (tasks: readonly Task[], f: TaskFilter): Task[] =>
  tasks.filter(
    (t) =>
      (!f.assignee || t.assigneeId === f.assignee) &&
      (!f.priority || t.priority === f.priority) &&
      (!f.milestone || t.milestoneId === f.milestone),
  )

/** "1 task · 0 done" beside the toolbar. */
export function tasksSummary(tasks: readonly Task[]): string {
  const done = tasks.filter((t) => t.status === "done").length
  return `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} · ${done} done`
}
