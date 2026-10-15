import { err, toDateOnly, type Cursor, type MemberDirectory, type Result } from "@/shared/domain"
import {
  UPCOMING_LIMIT,
  validateTaskInput,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from "../domain"
import type { IdeaPlace, TaskPatch, TasksRepository } from "./ports"

/** An idea's tasks, validated before they reach storage, and the members who can take them. */
export class TasksService {
  constructor(
    private readonly tasks: TasksRepository,
    private readonly directory: MemberDirectory,
  ) {}

  members = (spaceId: string) => this.directory.members(spaceId)
  list = (ideaId: string, after: Cursor | null) => this.tasks.list(ideaId, after)
  upcoming = (spaceId: string) => this.tasks.upcoming(spaceId, UPCOMING_LIMIT)
  remove = (id: string) => this.tasks.remove(id)

  async create(place: IdeaPlace, input: TaskInput): Promise<Result<Task>> {
    const valid = validateTaskInput(input)
    return valid.ok ? this.tasks.create({ ...place, ...valid.value }) : valid
  }

  async rename(id: string, title: string): Promise<Result<Task>> {
    const valid = validateTaskInput({ title, dueDate: null })
    return valid.ok ? this.tasks.update(id, { title: valid.value.title }) : valid
  }

  async setDue(id: string, dueDate: string | null): Promise<Result<Task>> {
    if (!dueDate) return this.tasks.update(id, { dueDate: null })
    const due = toDateOnly(dueDate)
    return due.ok
      ? this.tasks.update(id, { dueDate: due.value })
      : err({ ...due.error, field: "dueDate" })
  }

  move = (id: string, status: TaskStatus) => this.patch(id, { status })
  prioritize = (id: string, priority: TaskPriority) => this.patch(id, { priority })
  describe = (id: string, description: string) =>
    this.patch(id, { description: description.trim() })
  assign = (id: string, assigneeId: string | null) => this.patch(id, { assigneeId })
  linkMilestone = (id: string, milestoneId: string | null) => this.patch(id, { milestoneId })

  private patch(id: string, patch: TaskPatch): Promise<Result<Task>> {
    return this.tasks.update(id, patch)
  }
}
