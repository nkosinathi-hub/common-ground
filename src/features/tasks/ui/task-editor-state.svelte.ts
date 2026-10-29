import type { AppError } from "@/shared/domain"
import {
  TASK_STATUSES,
  type Task,
  type TaskDraft,
  type TaskPriority,
  type TaskStatus,
} from "../domain"
import { STALE_COPY } from "./conflict"
import type { TasksState } from "./tasks-state.svelte"

/** The S08 editor's fields: filled from the task, or blank in a column's status for a new one. */
export class TaskEditorState {
  title = $state("")
  description = $state("")
  status = $state<TaskStatus>("todo")
  priority = $state<TaskPriority>("medium")
  dueDate = $state("")
  assigneeId = $state("")
  milestoneId = $state("")
  error = $state<AppError | null>(null)
  busy = $state(false)

  constructor(private readonly board: TasksState) {}

  fill(task: Task | null, status: TaskStatus = TASK_STATUSES[1]) {
    this.title = task?.title ?? ""
    this.description = task?.description ?? ""
    this.status = task?.status ?? status
    this.priority = task?.priority ?? "medium"
    this.dueDate = task?.dueDate ?? ""
    this.assigneeId = task?.assigneeId ?? ""
    this.milestoneId = task?.milestoneId ?? ""
    this.error = null
  }

  get draft(): TaskDraft {
    return {
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate || null,
      assigneeId: this.assigneeId || null,
      milestoneId: this.milestoneId || null,
    }
  }

  /** One save for every field; a stale edit reloads the list and says so. Returns true when saved. */
  async save(task: Task | null): Promise<boolean> {
    this.busy = true
    const failure = task
      ? await this.board.save(task, this.draft)
      : await this.board.createFull(this.draft)
    this.busy = false
    this.error = failure?.kind === "conflict" ? { ...failure, message: STALE_COPY } : failure
    if (failure?.kind === "conflict") void this.board.load()
    return failure === null
  }
}
