import type { Place } from "./places"
import type { DateOnly } from "@/shared/domain"

export type ProgressStatus = "not_started" | "watching" | "completed" | "dropped"

export interface ProgressInput {
  readonly status: ProgressStatus
  readonly season: number | null
  readonly episode: number | null
  readonly rating: number | null
  readonly completedOn: DateOnly | null
}

export interface Progress extends ProgressInput {
  readonly userId: string
  readonly updatedAt: string
}

export interface MemberProgress {
  readonly me: string
  readonly entries: readonly Progress[]
  /** Where the space is together; null (or absent) before a watch party finishes. */
  readonly together?: Place | null
}

export interface SessionInput {
  readonly watchedOn: DateOnly
  readonly memberIds: readonly string[]
  readonly note: string
}

export interface WatchSession {
  readonly id: string
  readonly watchedOn: DateOnly
  readonly note: string | null
  readonly memberIds: readonly string[]
}
