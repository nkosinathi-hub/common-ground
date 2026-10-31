import type { Cursor, DateOnly, Page, Result } from "@/shared/domain"
import type {
  ChecklistItem,
  Milestone,
  Task,
  TaskPriority,
  TaskStatus,
  UpcomingTask,
} from "../domain"

/** The space and idea a new task or milestone belongs to. */
export interface IdeaPlace {
  readonly spaceId: string
  readonly ideaId: string
}

export interface NewTask extends IdeaPlace {
  readonly title: string
  readonly dueDate: DateOnly | null
  /** Added from a Kanban column, it starts in that column. */
  readonly status?: TaskStatus
}

export interface TaskPatch {
  readonly title?: string
  readonly description?: string
  readonly status?: TaskStatus
  readonly priority?: TaskPriority
  readonly dueDate?: DateOnly | null
  readonly assigneeId?: string | null
  readonly milestoneId?: string | null
}

export interface NewChecklistItem {
  readonly spaceId: string
  readonly taskId: string
  readonly label: string
  readonly position: number
}

export interface NewMilestone extends IdeaPlace {
  readonly title: string
  readonly targetDate: DateOnly | null
}

export interface MilestonePatch {
  readonly title?: string
  readonly targetDate?: DateOnly | null
  readonly completedAt?: string | null
}

export interface TasksRepository {
  list(ideaId: string, after: Cursor | null): Promise<Result<Page<Task>>>
  create(input: NewTask): Promise<Result<Task>>
  update(id: string, patch: TaskPatch): Promise<Result<Task>>
  /** The editor's one save; fails with kind "conflict" when someone saved in between. */
  save(id: string, expectedUpdatedAt: string, patch: TaskPatch): Promise<Result<Task>>
  remove(id: string): Promise<Result<void>>
  /** Open tasks with a due date in a space, soonest first. */
  upcoming(spaceId: string, limit: number): Promise<Result<UpcomingTask[]>>
}

export interface ChecklistRepository {
  list(taskId: string): Promise<Result<ChecklistItem[]>>
  add(item: NewChecklistItem): Promise<Result<ChecklistItem>>
  update(id: string, patch: { label?: string; done?: boolean }): Promise<Result<ChecklistItem>>
  remove(id: string): Promise<Result<void>>
}

export interface MilestonesRepository {
  list(ideaId: string): Promise<Result<Milestone[]>>
  create(milestone: NewMilestone): Promise<Result<Milestone>>
  /** Fails with kind "conflict" when the row's updated_at is no longer expectedUpdatedAt. */
  update(id: string, expectedUpdatedAt: string, patch: MilestonePatch): Promise<Result<Milestone>>
  remove(id: string): Promise<Result<void>>
}
