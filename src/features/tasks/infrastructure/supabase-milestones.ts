import type { DateOnly } from "@/shared/domain"
import type { Db } from "@/shared/infrastructure/supabase"
import type { MilestonesRepository } from "../application/ports"
import { MILESTONE_COLUMNS, toMilestone } from "./rows"
import { many, none, one, table } from "./table"

export class SupabaseMilestones implements MilestonesRepository {
  constructor(private readonly db: Db) {}
  list(ideaId: string) {
    return many(
      table(this.db, "milestones")
        .select(MILESTONE_COLUMNS)
        .eq("idea_id", ideaId)
        .order("target_date", { nullsFirst: false })
        .order("id"),
      toMilestone,
    )
  }
  create(spaceId: string, ideaId: string, title: string, targetDate: DateOnly | null) {
    const row = { space_id: spaceId, idea_id: ideaId, title, target_date: targetDate }
    return one(
      table(this.db, "milestones")
        .insert(row as never)
        .select(MILESTONE_COLUMNS)
        .single(),
      toMilestone,
    )
  }
  update(
    id: string,
    patch: { title?: string; targetDate?: DateOnly | null; completedAt?: string | null },
  ) {
    const row = {
      title: patch.title,
      target_date: patch.targetDate,
      completed_at: patch.completedAt,
    }
    const defined = Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined))
    return one(
      table(this.db, "milestones")
        .update(defined as never)
        .eq("id", id)
        .select(MILESTONE_COLUMNS)
        .single(),
      toMilestone,
    )
  }
  remove(id: string) {
    return none(table(this.db, "milestones").delete().eq("id", id))
  }
}
