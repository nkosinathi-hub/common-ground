import type { AppError, Cursor, Result } from "@/shared/domain"
import type { Member } from "../application/ports"
import type { TasksUseCases } from "../application/tasks-use-cases"
import type { Milestone, Task } from "../domain"

/** Tasks, members and milestones for one idea. */
export class TasksState {
  items = $state<Task[]>([])
  members = $state<Member[]>([])
  milestones = $state<Milestone[]>([])
  next = $state<Cursor | null>(null)
  loading = $state(true)
  error = $state<AppError | null>(null)
  view = $state<"list" | "kanban">("list")

  constructor(
    readonly uc: TasksUseCases,
    private readonly ids: () => { spaceId: string; ideaId: string },
  ) {}

  async load(more = false): Promise<void> {
    this.loading = true
    const { spaceId, ideaId } = this.ids()
    const [page, members, milestones] = await Promise.all([
      this.uc.list(ideaId, more ? this.next : null),
      more ? null : this.uc.members(spaceId),
      more ? null : this.uc.milestones(ideaId),
    ])
    this.loading = false
    if (!page.ok) return void (this.error = page.error)
    this.error = null
    this.items = more ? [...this.items, ...page.value.items] : [...page.value.items]
    this.next = page.value.next
    if (members?.ok) this.members = members.value
    if (milestones?.ok) this.milestones = milestones.value
  }

  /** Applies a task write to the list; returns the error for the caller to show. */
  async apply(write: Promise<Result<Task>>): Promise<AppError | null> {
    const result = await write
    if (!result.ok) return result.error
    const exists = this.items.some((t) => t.id === result.value.id)
    this.items = exists
      ? this.items.map((t) => (t.id === result.value.id ? result.value : t))
      : [result.value, ...this.items]
    return null
  }

  async remove(id: string): Promise<AppError | null> {
    const result = await this.uc.remove(id)
    if (!result.ok) return result.error
    this.items = this.items.filter((t) => t.id !== id)
    return null
  }
}
