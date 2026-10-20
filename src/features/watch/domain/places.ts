import type { ProgressStatus } from "./progress-types"

/** Where someone is in a series: the last episode watched. A film has no season or episode. */
export interface Place {
  readonly season: number | null
  readonly episode: number | null
}

export interface MemberPlace extends Place {
  readonly userId: string
  readonly status: ProgressStatus
}

const STATUSES: readonly ProgressStatus[] = ["not_started", "watching", "completed", "dropped"]
type Raw = Record<string, unknown>
const count = (v: unknown): number | null => (Number.isInteger(v) ? (v as number) : null)

function placeOf(raw: Raw): Place | null {
  const season = count(raw.season)
  const episode = count(raw.episode)
  const bare = raw.season === null && raw.episode === null
  return (season !== null && episode !== null) || bare ? { season, episode } : null
}

/** list_watch_items `places`: every member's place; anything malformed is skipped. */
export function parsePlaces(json: unknown): MemberPlace[] {
  if (!Array.isArray(json)) return []
  return json.flatMap((value): MemberPlace[] => {
    const raw = (value ?? {}) as Raw
    const status = raw.status as ProgressStatus
    if (typeof raw.user_id !== "string" || !STATUSES.includes(status)) return []
    const place = placeOf(raw) ?? { season: null, episode: null }
    return [{ userId: raw.user_id, status, ...place }]
  })
}

/** list_watch_items `together`: null until a watch party finishes. */
export function parseTogether(json: unknown): Place | null {
  return json && typeof json === "object" ? placeOf(json as Raw) : null
}

export const placeLabel = (p: Place): string | null =>
  p.season !== null && p.episode !== null ? `S${p.season}E${p.episode}` : null

/** Watched further alone than the space has together (or nothing together yet). */
export function aheadOf(p: Place, together: Place | null): boolean {
  if (p.season === null || p.episode === null) return false
  if (!together || together.season === null || together.episode === null) return true
  return (
    p.season > together.season || (p.season === together.season && p.episode > together.episode)
  )
}
