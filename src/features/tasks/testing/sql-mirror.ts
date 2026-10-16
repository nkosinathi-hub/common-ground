import { compareDateOnly } from "@/shared/domain"
import type { UpcomingTask } from "../domain"

/** Mirrors upcoming_tasks' order (due date, then title) for the in-memory repository. */
export const sortUpcoming = (tasks: readonly UpcomingTask[]): UpcomingTask[] =>
  [...tasks].sort((a, b) => compareDateOnly(a.dueDate, b.dueDate) || a.title.localeCompare(b.title))
