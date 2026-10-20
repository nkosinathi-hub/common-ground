import { SYNC } from "./sync-constants"

export interface HostCandidate {
  readonly userId: string
  readonly joinedAt: string
}

export interface HostElection {
  readonly hostId: string
  /** Members present now, from presence. */
  readonly present: readonly HostCandidate[]
  /** Local clock when the host was last in presence. */
  readonly hostLastSeenAt: number
  readonly now: number
}

/**
 * Who hosts now. A host missing from presence for the absence limit is replaced by the
 * earliest-joined member present (ties by id), so every client picks the same person.
 */
export function electHost({ hostId, present, hostLastSeenAt, now }: HostElection): string {
  if (present.some((p) => p.userId === hostId)) return hostId
  if (now - hostLastSeenAt < SYNC.hostAbsentMs) return hostId
  const [first] = [...present].sort(
    (a, b) => a.joinedAt.localeCompare(b.joinedAt) || a.userId.localeCompare(b.userId),
  )
  return first?.userId ?? hostId
}
