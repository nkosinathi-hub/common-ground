import { appError, err, ok, type Result } from "@/shared/domain"
import { removed, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { MilestonePatch, MilestonesRepository, NewMilestone } from "../application/ports"
import type { Milestone } from "../domain"
import { MILESTONE_COLUMNS, toMilestone, type MilestoneRow } from "./rows"

const STALE = "Someone else changed this. Reload to see their version"

/** The update matched on the updated_at the client saw: no row back means it went stale. */
const current = (data: MilestoneRow[]): Result<Milestone> => {
  const [row] = data
  return row ? ok(toMilestone(row)) : err(appError("conflict", STALE))
}

export class SupabaseMilestones implements MilestonesRepository {
  constructor(private readonly db: Db) {}

  private get milestones() {
    return this.db.from("milestones")
  }

  list(ideaId: string): Promise<Result<Milestone[]>> {
    const query = this.milestones.select(MILESTONE_COLUMNS).eq("idea_id", ideaId)
    const ordered = query.order("target_date", { nullsFirst: false }).order("id")
    return settle(ordered, (data) => data.map(toMilestone))
  }

  create(milestone: NewMilestone): Promise<Result<Milestone>> {
    const { spaceId, ideaId, title, targetDate } = milestone
    const row = { space_id: spaceId, idea_id: ideaId, title, target_date: targetDate }
    return settle(this.milestones.insert(row).select(MILESTONE_COLUMNS).single(), toMilestone)
  }

  async update(
    id: string,
    expectedUpdatedAt: string,
    patch: MilestonePatch,
  ): Promise<Result<Milestone>> {
    const row = {
      title: patch.title,
      target_date: patch.targetDate,
      completed_at: patch.completedAt,
    }
    const query = this.milestones.update(row).eq("id", id).eq("updated_at", expectedUpdatedAt)
    const rows = await settle(query.select(MILESTONE_COLUMNS), (data) => data)
    return rows.ok ? current(rows.value) : rows
  }

  remove(id: string): Promise<Result<void>> {
    return removed(this.milestones.delete().eq("id", id).select("id"))
  }
}
