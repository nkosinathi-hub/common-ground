import { appError, err, ok, type Result } from "@/shared/domain"

export const BRIEF_FIELDS = [
  "pitch",
  "problem",
  "audience",
  "solution",
  "valueProposition",
  "revenueModel",
  "successMeasures",
  "nextStep",
] as const
export type BriefField = (typeof BRIEF_FIELDS)[number]
export type Brief = Partial<Record<BriefField, string>>

export const BRIEF_MAX = 4000

export function cleanBrief(input: Brief): Result<Brief> {
  const brief: Brief = {}
  for (const field of BRIEF_FIELDS) {
    const value = input[field]?.trim() ?? ""
    if (value.length > BRIEF_MAX) {
      return err(appError("validation", `Keep this to ${BRIEF_MAX} characters`, field))
    }
    if (value.length > 0) brief[field] = value
  }
  return ok(brief)
}

/** Fields whose text differs; drives the merge prompt after a conflict. */
export function changedFields(mine: Brief, theirs: Brief): BriefField[] {
  return BRIEF_FIELDS.filter((field) => (mine[field] ?? "") !== (theirs[field] ?? ""))
}
