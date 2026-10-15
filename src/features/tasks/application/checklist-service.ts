import type { Result } from "@/shared/domain"
import { nextPosition, validateLabel, type ChecklistItem, type Task } from "../domain"
import type { ChecklistRepository } from "./ports"

/** A task's checklist; new items go after the ones already there. */
export class ChecklistService {
  constructor(private readonly items: ChecklistRepository) {}

  list = (taskId: string) => this.items.list(taskId)
  toggle = (id: string, done: boolean) => this.items.update(id, { done })
  remove = (id: string) => this.items.remove(id)

  async add(
    task: Pick<Task, "id" | "spaceId">,
    label: string,
    existing: readonly ChecklistItem[],
  ): Promise<Result<ChecklistItem>> {
    const valid = validateLabel(label)
    if (!valid.ok) return valid
    const position = nextPosition(existing)
    return this.items.add({ spaceId: task.spaceId, taskId: task.id, label: valid.value, position })
  }
}
