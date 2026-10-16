import { appError, err, ok, type Result } from "@/shared/domain"

/** Longest checklist item label, in characters. */
export const LABEL_MAX = 200

export interface ChecklistItem {
  readonly id: string
  readonly taskId: string
  readonly label: string
  readonly done: boolean
  readonly position: number
  /** Its author; only they or the space owner may delete it. */
  readonly createdBy: string | null
}

export function validateLabel(input: string): Result<string> {
  const label = input.trim()
  return label.length >= 1 && label.length <= LABEL_MAX
    ? ok(label)
    : err(appError("validation", "Checklist items need 1 to 200 characters", "label"))
}

export const checklistProgress = (items: readonly ChecklistItem[]) => ({
  done: items.filter((item) => item.done).length,
  total: items.length,
})

export const nextPosition = (items: readonly ChecklistItem[]) =>
  items.reduce((max, item) => Math.max(max, item.position + 1), 0)
