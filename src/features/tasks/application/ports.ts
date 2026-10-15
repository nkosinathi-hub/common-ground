import type { Cursor, DateOnly, Page, Result } from "@/shared/domain"
import type {
  ChecklistItem,
  Milestone,
  Task,
  TaskPriority,
  TaskStatus,
  UpcomingTask,
} from "../domain"

export interface NewTask {
  readonly spaceId: string
  readonly ideaId: string
  readonly title: string
  readonly dueDate: DateOnly | null
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

export interface TasksRepository {
  list(ideaId: string, after: Cursor | null): Promise<Result<Page<Task>>>
  create(input: NewTask): Promise<Result<Task>>
  update(id: string, patch: TaskPatch): Promise<Result<Task>>
  remove(id: string): Promise<Result<void>>
  /** Open tasks with a due date in a space, soonest first. */
  upcoming(spaceId: string, limit: number): Promise<Result<UpcomingTask[]>>
}

export interface ChecklistRepository {
  list(taskId: string): Promise<Result<ChecklistItem[]>>
  add(
    spaceId: string,
    taskId: string,
    label: string,
    position: number,
  ): Promise<Result<ChecklistItem>>
  update(id: string, patch: { label?: string; done?: boolean }): Promise<Result<ChecklistItem>>
  remove(id: string): Promise<Result<void>>
}

export interface MilestonesRepository {
  list(ideaId: string): Promise<Result<Milestone[]>>
  create(
    spaceId: string,
    ideaId: string,
    title: string,
    targetDate: DateOnly | null,
  ): Promise<Result<Milestone>>
  update(
    id: string,
    patch: { title?: string; targetDate?: DateOnly | null; completedAt?: string | null },
  ): Promise<Result<Milestone>>
  remove(id: string): Promise<Result<void>>
}

export interface Member {
  readonly id: string
  readonly displayName: string
}

/** Current members of a space; wired to the spaces feature in composition. */
export interface MemberDirectory {
  members(spaceId: string): Promise<Result<Member[]>>
}
