import type { Database } from "@/shared/infrastructure/database.types"
import type { Party, StartParty, TogetherProgress } from "../domain/party"

type Fns = Database["public"]["Functions"]
type PartyRow = Database["public"]["Tables"]["watch_parties"]["Row"]
type MemberRow = Pick<
  Database["public"]["Tables"]["watch_party_members"]["Row"],
  "user_id" | "confirmed" | "joined_at"
>

export const PARTY_COLUMNS =
  "id, space_id, watch_item_id, host_id, source, status, from_season, from_episode, to_season, to_episode, season_episode_counts, started_at, ended_at, created_at, members:watch_party_members(user_id, confirmed, joined_at)"

/** The generated types mark RPC arguments required; a film party sends SQL nulls. */
const sqlNull = <V>(value: V | null): V => value as V

export function startArgs({ watchItemId, source, range }: StartParty): Fns["start_party"]["Args"] {
  return {
    item: watchItemId,
    src: source,
    s1: sqlNull(range?.from.season ?? null),
    e1: sqlNull(range?.from.episode ?? null),
    s2: sqlNull(range?.to.season ?? null),
    e2: sqlNull(range?.to.episode ?? null),
    counts: sqlNull(range?.seasonEpisodeCounts ? [...range.seasonEpisodeCounts] : null),
  }
}

function rangeOf(row: PartyRow): Party["range"] {
  const { from_season: s1, from_episode: e1, to_season: s2, to_episode: e2 } = row
  if (s1 === null || e1 === null || s2 === null || e2 === null) return null
  const range = { from: { season: s1, episode: e1 }, to: { season: s2, episode: e2 } }
  return row.season_episode_counts
    ? { ...range, seasonEpisodeCounts: row.season_episode_counts }
    : range
}

export const toParty = (row: PartyRow & { members: MemberRow[] }): Party => ({
  id: row.id,
  spaceId: row.space_id,
  watchItemId: row.watch_item_id,
  hostId: row.host_id,
  source: row.source,
  status: row.status,
  range: rangeOf(row),
  startedAt: row.started_at,
  endedAt: row.ended_at,
  createdAt: row.created_at,
  members: row.members.map((m) => ({
    userId: m.user_id,
    confirmed: m.confirmed,
    joinedAt: m.joined_at,
  })),
})

export const toTogether = (
  row: { season: number | null; episode: number | null } | undefined,
): TogetherProgress => {
  if (!row) return null
  return row.season === null || row.episode === null
    ? { at: null }
    : { at: { season: row.season, episode: row.episode } }
}
