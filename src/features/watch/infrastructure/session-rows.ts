import type { DateOnly } from "@/shared/domain"
import type { Tables } from "@/shared/infrastructure/database.types"
import type * as T from "../domain/types"

export interface SessionRow
  extends
    Pick<Tables<"watch_sessions">, "id" | "watched_on" | "note">,
    Partial<
      Pick<Tables<"watch_sessions">, "from_season" | "from_episode" | "to_season" | "to_episode">
    > {
  readonly watch_session_members: { user_id: string }[] | null
}

export const toSession = (row: SessionRow): T.WatchSession => ({
  id: row.id,
  watchedOn: row.watched_on as DateOnly,
  note: row.note,
  memberIds: (row.watch_session_members ?? []).map((member) => member.user_id),
  range:
    row.from_episode != null && row.to_episode != null
      ? {
          from: { season: row.from_season ?? null, episode: row.from_episode },
          to: { season: row.to_season ?? null, episode: row.to_episode },
        }
      : null,
})
