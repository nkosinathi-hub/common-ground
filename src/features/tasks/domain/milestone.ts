import { appError, err, ok, toDateOnly, type DateOnly, type Result } from "@/shared/domain"
import { TITLE_MAX } from "./task"

export interface Milestone {
  readonly id: string
  readonly spaceId: string
  readonly ideaId: string
  readonly title: string
  readonly targetDate: DateOnly | null
  readonly completedAt: string | null
  /** Exact server timestamp string; edits send it back as their precondition. */
  readonly updatedAt: string
}

export interface MilestoneInput {
  readonly title: string
  readonly targetDate: string | null
}

export function validateMilestone(
  input: MilestoneInput,
): Result<{ title: string; targetDate: DateOnly | null }> {
  const title = input.title.trim()
  if (title.length < 1 || title.length > TITLE_MAX) {
    return err(
      appError("validation", "Give the milestone a title of up to 200 characters", "title"),
    )
  }
  if (!input.targetDate) return ok({ title, targetDate: null })
  const target = toDateOnly(input.targetDate)
  return target.ok
    ? ok({ title, targetDate: target.value })
    : err({ ...target.error, field: "targetDate" })
}

export const milestoneProgress = (milestones: readonly Milestone[]) => ({
  done: milestones.filter((m) => m.completedAt !== null).length,
  total: milestones.length,
})
