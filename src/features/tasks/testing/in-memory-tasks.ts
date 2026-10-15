import {
  appError,
  err,
  nextCursor,
  ok,
  PAGE_SIZE,
  type Cursor,
  type Page,
  type Result,
} from "@/shared/domain"
import type {
  Member,
  MemberDirectory,
  NewTask,
  TaskPatch,
  TasksRepository,
} from "../application/ports"
import { sortUpcoming, type Task, type UpcomingTask } from "../domain"
import { Store } from "./in-memory-store"

export class FakeMembers implements MemberDirectory {
  constructor(
    public list: Member[] = [
      { id: "ana", displayName: "Ana" },
      { id: "ben", displayName: "Ben" },
    ],
  ) {}
  async members(): Promise<Result<Member[]>> {
    return ok(this.list)
  }
}

/** Mirrors the database rule: an assignee must be a current member. */
export class InMemoryTasks implements TasksRepository {
  readonly store = new Store<Task>()
  readonly ideaTitles = new Map<string, string>()
  constructor(private readonly members = new FakeMembers()) {}

  async list(ideaId: string, after: Cursor | null): Promise<Result<Page<Task>>> {
    const all = this.store.where((t) => t.ideaId === ideaId).reverse()
    const start = after ? all.findIndex((t) => t.id === after.id) + 1 : 0
    const items = all.slice(start, start + PAGE_SIZE)
    return ok({ items, next: nextCursor(items) })
  }

  async create(input: NewTask): Promise<Result<Task>> {
    const id = this.store.nextId("task")
    const at = this.store.stamp()
    return this.store.put({
      ...input,
      id,
      description: "",
      status: "backlog",
      priority: "medium",
      assigneeId: null,
      milestoneId: null,
      createdAt: at,
      updatedAt: at,
    })
  }

  async update(id: string, patch: TaskPatch): Promise<Result<Task>> {
    if (patch.assigneeId && !this.members.list.some((m) => m.id === patch.assigneeId)) {
      return err(appError("validation", "assignee must be a member of this space"))
    }
    return this.store.patch(id, patch as Partial<Task>)
  }

  async remove(id: string) {
    return this.store.remove(id)
  }

  async upcoming(spaceId: string, limit: number): Promise<Result<UpcomingTask[]>> {
    const open = this.store.where(
      (t) => t.spaceId === spaceId && t.status !== "done" && t.dueDate !== null,
    )
    const rows = open.map((t) => ({
      ...t,
      dueDate: t.dueDate!,
      ideaTitle: this.ideaTitles.get(t.ideaId) ?? "",
    }))
    return ok(sortUpcoming(rows).slice(0, limit))
  }
}
