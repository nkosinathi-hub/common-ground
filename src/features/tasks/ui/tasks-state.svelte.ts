import type { AppError, Cursor, MemberRef, Result } from "@/shared/domain"
import { PagedList } from "@/shared/ui"
import type { IdeaPlace } from "../application/ports"
import type { TasksContext } from "./context"
import type { Milestone, Task } from "../domain"

type View = "list" | "kanban"

/** One idea's tasks, paged newest first, with the members and milestones their pickers offer. */
export class TasksState {
  readonly list: PagedList<Task, Cursor>
  members = $state<MemberRef[]>([])
  milestones = $state<Milestone[]>([])
  view = $state<View>("list")

  constructor(
    readonly services: TasksContext,
    private readonly place: () => IdeaPlace,
  ) {
    this.list = new PagedList((after) => services.tasks.list(place().ideaId, after))
  }

  async load(): Promise<void> {
    const { spaceId, ideaId } = this.place()
    const [, members, milestones] = await Promise.all([
      this.list.load(),
      this.services.tasks.members(spaceId),
      this.services.milestones.list(ideaId),
    ])
    if (members.ok) this.members = members.value
    if (milestones.ok) this.milestones = milestones.value
  }

  /** Adds a new task at the top; returns the error for the form to show. */
  create(title: string, dueDate: string | null): Promise<AppError | null> {
    return this.list.add(this.services.tasks.create(this.place(), { title, dueDate }))
  }

  /** Applies an edit to one task; returns the error for the card to show. */
  update(write: Promise<Result<Task>>): Promise<AppError | null> {
    return this.list.replace(write)
  }

  remove(id: string): Promise<AppError | null> {
    return this.list.remove(id, this.services.tasks.remove(id))
  }
}
