import type { MemberRef } from "@/shared/domain"
import { TASK_PRIORITIES, TASK_STATUSES, type Milestone } from "../domain"
import { PRIORITY_LABELS, STATUS_LABELS } from "./labels"

/** The editor's and the filters' choices, so both offer the same words. */
export const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))
export const PRIORITY_OPTIONS = TASK_PRIORITIES.map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
}))
export const memberOptions = (members: readonly MemberRef[], none: string) => [
  { value: "", label: none },
  ...members.map((m) => ({ value: m.id, label: m.displayName })),
]
export const milestoneOptions = (milestones: readonly Milestone[], none: string) => [
  { value: "", label: none },
  ...milestones.map((m) => ({ value: m.id, label: m.title })),
]
