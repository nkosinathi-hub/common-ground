import type { TaskPriority, TaskStatus } from "../domain"

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
}
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}
export const SELECT = "border-input bg-background h-7 rounded-md border px-1 text-xs"
