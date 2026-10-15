import { getContext, setContext } from "svelte"
import type { TasksUseCases } from "../application/tasks-use-cases"

const KEY = Symbol("tasks")

/** Called by src/app/composition.ts with use cases bound to real adapters. */
export function provideTasks(useCases: TasksUseCases): void {
  setContext(KEY, useCases)
}

export function useTasks(): TasksUseCases {
  const useCases = getContext<TasksUseCases | undefined>(KEY)
  if (!useCases) throw new Error("provideTasks was not called above this component")
  return useCases
}
