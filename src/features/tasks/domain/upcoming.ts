import { compareDateOnly, type DateOnly } from "@/shared/domain"
import type { TaskPriority, TaskStatus } from "./task"

/** An open task with a due date, with its idea for linking from Home. */
export interface UpcomingTask {
  readonly id: string
  readonly ideaId: string
  readonly ideaTitle: string
  readonly title: string
  readonly status: TaskStatus
  readonly dueDate: DateOnly
  readonly priority: TaskPriority
  /** Who it is assigned to, or null when nobody is. */
  readonly assigneeName: string | null
}

export const UPCOMING_LIMIT = 8

export type DueState = "overdue" | "today" | "soon"

/** Compares calendar days only, so the viewer's time zone never shifts the answer. */
export function dueState(due: DateOnly, today: DateOnly): DueState {
  const order = compareDateOnly(due, today)
  return order < 0 ? "overdue" : order === 0 ? "today" : "soon"
}
