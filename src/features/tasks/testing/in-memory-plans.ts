import { ok, type DateOnly, type Result } from "@/shared/domain"
import type { ChecklistRepository, MilestonesRepository } from "../application/ports"
import type { ChecklistItem, Milestone } from "../domain"
import { Store } from "./in-memory-store"

export class InMemoryChecklist implements ChecklistRepository {
  readonly store = new Store<ChecklistItem>()
  async list(taskId: string): Promise<Result<ChecklistItem[]>> {
    return ok(this.store.where((i) => i.taskId === taskId).sort((a, b) => a.position - b.position))
  }
  async add(_spaceId: string, taskId: string, label: string, position: number) {
    return this.store.put({ id: this.store.nextId("item"), taskId, label, position, done: false })
  }
  async update(id: string, patch: { label?: string; done?: boolean }) {
    return this.store.patch(id, patch)
  }
  async remove(id: string) {
    return this.store.remove(id)
  }
}

export class InMemoryMilestones implements MilestonesRepository {
  readonly store = new Store<Milestone>()
  async list(ideaId: string): Promise<Result<Milestone[]>> {
    return ok(this.store.where((m) => m.ideaId === ideaId))
  }
  async create(spaceId: string, ideaId: string, title: string, targetDate: DateOnly | null) {
    return this.store.put({
      id: this.store.nextId("ms"),
      spaceId,
      ideaId,
      title,
      targetDate,
      completedAt: null,
    })
  }
  async update(id: string, patch: Partial<Milestone>) {
    return this.store.patch(id, patch)
  }
  async remove(id: string) {
    return this.store.remove(id)
  }
}
