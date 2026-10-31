import type { AppError, Result } from "@/shared/domain"
import { Resource } from "@/shared/ui"
import type { IdeaPlace } from "../application/ports"
import { milestoneProgress, type Milestone, type MilestoneInput, type Task } from "../domain"
import { STALE_COPY } from "./conflict"
import type { TasksContext } from "./context"

type Change<T> = (value: T, items: Milestone[]) => Milestone[]
const replace: Change<Milestone> = (saved, items) =>
  items.map((item) => (item.id === saved.id ? saved : item))

/** One idea's milestones and the tasks linked to them; a stale edit reloads and says so. */
export class MilestonesState {
  readonly list: Resource<Milestone[]>
  readonly tasks
  error = $state<AppError | null>(null)

  constructor(
    private readonly services: TasksContext,
    private readonly place: () => IdeaPlace,
  ) {
    this.list = new Resource(() => services.milestones.list(place().ideaId))
    this.tasks = new Resource(() => services.tasks.list(place().ideaId, null))
  }

  get progress() {
    return milestoneProgress(this.list.value ?? [])
  }

  load = () => Promise.all([this.list.load(), this.tasks.load()])
  linkedTo = (m: Milestone): Task[] =>
    (this.tasks.value?.items ?? []).filter((t) => t.milestoneId === m.id)

  /** False keeps a form open to fix an error; a conflict still closes it onto their version. */
  private async run<T>(write: Promise<Result<T>>, change: Change<T>): Promise<boolean> {
    const failure = await this.list.apply(write, (value, items) => change(value, items ?? []))
    this.error = failure
    if (!failure || failure.kind !== "conflict") return !failure
    this.error = { ...failure, message: STALE_COPY }
    await this.list.load()
    return true
  }

  add = (input: MilestoneInput) =>
    this.run(this.services.milestones.add(this.place(), input), (added, items) => [...items, added])
  toggle = (m: Milestone, done: boolean) =>
    this.run(this.services.milestones.complete(m, done), replace)
  remove = (id: string) =>
    this.run(this.services.milestones.remove(id), (_gone, items) =>
      items.filter((i) => i.id !== id),
    )

  /** Saves the title and date, then the completion if it changed, on the fresh copy. */
  async save(m: Milestone, input: MilestoneInput, done: boolean): Promise<boolean> {
    if (!(await this.run(this.services.milestones.retarget(m, input), replace))) return false
    const fresh = this.list.value?.find((item) => item.id === m.id)
    if (!fresh || (fresh.completedAt !== null) === done) return true
    return this.run(this.services.milestones.complete(fresh, done), replace)
  }
}
