import type { Result } from "@/shared/domain"
import { validateMilestone, type Milestone, type MilestoneInput } from "../domain"
import type { IdeaPlace, MilestonesRepository } from "./ports"

/**
 * An idea's milestones. Edits carry the version the client saw (base) and fail with kind
 * "conflict" when someone else changed it first. The clock is injected so completion is testable.
 */
export class MilestonesService {
  constructor(
    private readonly milestones: MilestonesRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  list = (ideaId: string) => this.milestones.list(ideaId)
  remove = (id: string) => this.milestones.remove(id)

  async add(place: IdeaPlace, input: MilestoneInput): Promise<Result<Milestone>> {
    const valid = validateMilestone(input)
    return valid.ok ? this.milestones.create({ ...place, ...valid.value }) : valid
  }

  complete(base: Milestone, done: boolean): Promise<Result<Milestone>> {
    const completedAt = done ? this.now().toISOString() : null
    return this.milestones.update(base.id, base.updatedAt, { completedAt })
  }

  async retarget(base: Milestone, input: MilestoneInput): Promise<Result<Milestone>> {
    const valid = validateMilestone(input)
    return valid.ok ? this.milestones.update(base.id, base.updatedAt, valid.value) : valid
  }
}
