import { getContext, setContext } from "svelte"
import type { ChecklistService } from "../application/checklist-service"
import type { MilestonesService } from "../application/milestones-service"
import type { TasksService } from "../application/tasks-service"

const KEY = Symbol("tasks")

export interface TasksContext {
  readonly tasks: TasksService
  readonly checklist: ChecklistService
  readonly milestones: MilestonesService
}

/** Called once by the composition root (src/app/composition). */
export function provideTasks(value: TasksContext): void {
  setContext(KEY, value)
}

export function useTasks(): TasksContext {
  const value = getContext<TasksContext | undefined>(KEY)
  if (!value) throw new Error("Tasks are not provided: call provideTasks")
  return value
}
