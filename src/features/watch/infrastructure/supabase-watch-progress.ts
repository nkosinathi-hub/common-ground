import type { SupabaseClient } from "@supabase/supabase-js"
import { ok, type Result } from "@/shared/domain"
import type * as T from "../domain/types"
import {
  toProgress,
  toSession,
  unit,
  unwrap,
  type ProgressRow,
  type SessionRow,
} from "./watch-rows"

/** Per-member progress and the watched-together log. Each member writes only their own row. */
export class SupabaseWatchProgress {
  constructor(protected readonly db: SupabaseClient) {}

  protected async me(): Promise<string> {
    const { data } = await this.db.auth.getUser()
    return data.user?.id ?? ""
  }

  async progress(itemId: string): Promise<Result<T.MemberProgress>> {
    const [rows, me] = await Promise.all([
      this.db
        .from("watch_progress")
        .select("user_id, status, season, episode, rating, completed_on, updated_at")
        .eq("watch_item_id", itemId)
        .order("updated_at", { ascending: false }),
      this.me(),
    ])
    const found = unwrap<ProgressRow[]>(rows)
    return found.ok ? ok({ me, entries: (found.value ?? []).map(toProgress) }) : found
  }

  saveProgress = async (itemId: string, input: T.ProgressInput) =>
    unit(
      await this.db.rpc("save_watch_progress", {
        item: itemId,
        new_status: input.status,
        new_season: input.season,
        new_episode: input.episode,
        new_rating: input.rating,
        new_completed_on: input.completedOn,
      }),
    )

  async sessions(itemId: string): Promise<Result<T.WatchSession[]>> {
    const rows = unwrap<SessionRow[]>(
      await this.db
        .from("watch_sessions")
        .select("id, watched_on, note, watch_session_members(user_id)")
        .eq("watch_item_id", itemId)
        .order("watched_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50),
    )
    return rows.ok ? ok((rows.value ?? []).map(toSession)) : rows
  }

  logSession = async (itemId: string, input: T.SessionInput) =>
    unwrap<string>(
      await this.db.rpc("log_watch_session", {
        item: itemId,
        watched_on: input.watchedOn,
        member_ids: input.memberIds,
        note: input.note || null,
      }),
    )
}
