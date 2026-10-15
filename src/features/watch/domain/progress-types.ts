import type { DateOnly } from "@/shared/domain"
import type { ProgressStatus } from "./types"

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

export interface SpaceMember {
  readonly id: string
  readonly displayName: string
}
