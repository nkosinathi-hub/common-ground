import type { Result } from "@/shared/domain"
import { done, same, settle, signedOut } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type * as T from "../domain/types"
import { parseTogether } from "../domain/places"
import { progressArgs } from "./watch-args"
import { toProgress, toSession } from "./watch-rows"

/** The watched-together log keeps the latest nights for a title. */
const RECENT_SESSIONS = 50

/** Per-member progress and the watched-together log. Each member writes only their own row. */
export class SupabaseWatchProgress {
  constructor(protected readonly db: Db) {}

  /** The signed-in user's id, or null when signed out. */
  protected async me(): Promise<string | null> {
    const { data } = await this.db.auth.getUser()
    return data.user?.id ?? null
  }

  async progress(itemId: string): Promise<Result<T.MemberProgress>> {
    const me = await this.me()
    if (!me) return signedOut()
    const query = this.db
      .from("watch_progress")
      .select("user_id, status, season, episode, rating, completed_on, updated_at")
      .eq("watch_item_id", itemId)
      .order("updated_at", { ascending: false })
    const together = this.db
      .from("together_progress")
      .select("season, episode")
      .eq("watch_item_id", itemId)
      .maybeSingle()
    const [rows, shared] = await Promise.all([query, together])
    return settle(Promise.resolve(rows), (data) => ({
      me,
      entries: data.map(toProgress),
      together: shared.data ? parseTogether(shared.data) : null,
    }))
  }

  saveProgress = (itemId: string, input: T.ProgressInput) =>
    done(this.db.rpc("save_watch_progress", progressArgs(itemId, input)))

  sessions(itemId: string): Promise<Result<T.WatchSession[]>> {
    const query = this.db
      .from("watch_sessions")
      .select("id, watched_on, note, watch_session_members(user_id)")
      .eq("watch_item_id", itemId)
      .order("watched_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(RECENT_SESSIONS)
    return settle(query, (rows) => rows.map(toSession))
  }

  logSession = (itemId: string, input: T.SessionInput) =>
    settle(
      this.db.rpc("log_watch_session", {
        item: itemId,
        watched_on: input.watchedOn,
        member_ids: [...input.memberIds],
        note: input.note || undefined,
      }),
      same,
    )
}
