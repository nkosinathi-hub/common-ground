import {
  appError,
  compareDateOnly,
  type DateOnly,
  err,
  ok,
  type Result,
  TITLE_MAX,
  toDateOnly,
} from "@/shared/domain"

export const TASK_STATUSES = ["backlog", "todo", "in_progress", "done"] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export interface Task {
  readonly id: string
  readonly spaceId: string
  readonly ideaId: string
  readonly title: string
  readonly description: string
  readonly status: TaskStatus
  readonly priority: TaskPriority
  readonly dueDate: DateOnly | null
  readonly assigneeId: string | null
  readonly milestoneId: string | null
  /** Its author; only they or the space owner may delete it. */
  readonly createdBy: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface TaskInput {
  readonly title: string
  readonly dueDate: string | null
}

export function validateTaskInput(
  input: TaskInput,
): Result<{ title: string; dueDate: DateOnly | null }> {
  const title = input.title.trim()
  if (title.length < 1 || title.length > TITLE_MAX) {
    return err(
      appError("validation", `Give the task a title of up to ${TITLE_MAX} characters`, "title"),
    )
  }
  if (!input.dueDate) return ok({ title, dueDate: null })
  const due = toDateOnly(input.dueDate)
  return due.ok ? ok({ title, dueDate: due.value }) : err({ ...due.error, field: "dueDate" })
}

export const groupByStatus = (tasks: readonly Task[]) =>
  TASK_STATUSES.map((status) => ({ status, tasks: tasks.filter((task) => task.status === status) }))

export const isOverdue = (task: Task, today: DateOnly): boolean =>
  task.status !== "done" && task.dueDate !== null && compareDateOnly(task.dueDate, today) < 0
