import { err, nextCursor, ok, PAGE_SIZE, type Cursor, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import { olderThan } from "@/shared/infrastructure/paging"
import type { Db } from "@/shared/infrastructure/supabase"
import type { ActivityGateway, NotificationsGateway } from "../application/ports"
import type { ActivityEvent, Notification } from "../domain/notification"

const NOTE =
  "id, space_id, type, subject_type, subject_id, read_at, created_at, actor:profiles!notifications_actor_id_fkey(display_name)"
const EVENT =
  "id, event_type, subject_type, subject_id, created_at, actor:profiles!activity_events_actor_id_fkey(display_name)"

type Named = { actor: { display_name: string } | null }

export class SupabaseNotifications implements NotificationsGateway {
  constructor(private readonly db: Db) {}

  async list(after: Cursor | null) {
    let query = this.db
      .from("notifications")
      .select(NOTE)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE)
    if (after) query = query.or(olderThan(after))
    const { data, error } = await query
    if (error) return err(toAppError(error))
    const items: Notification[] = (data ?? []).map((r) => ({
      id: r.id,
      spaceId: r.space_id,
      type: r.type,
      subjectType: r.subject_type,
      subjectId: r.subject_id,
      readAt: r.read_at,
      createdAt: r.created_at,
      actorName: (r as unknown as Named).actor?.display_name ?? null,
    }))
    return ok({ items, next: nextCursor(items) })
  }

  async markRead(ids: readonly string[]): Promise<Result<void>> {
    const { error } = await this.db
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", [...ids])
    return error ? err(toAppError(error)) : ok(undefined)
  }

  async markAllRead(): Promise<Result<void>> {
    const { error } = await this.db
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null)
    return error ? err(toAppError(error)) : ok(undefined)
  }

  subscribe(onChange: () => void): () => void {
    const channel = this.db
      .channel(`notifications-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        onChange,
      )
      .subscribe()
    return () => void this.db.removeChannel(channel)
  }
}

export class SupabaseActivity implements ActivityGateway {
  constructor(private readonly db: Db) {}

  async list(spaceId: string, after: Cursor | null) {
    let query = this.db
      .from("activity_events")
      .select(EVENT)
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE)
    if (after) query = query.or(olderThan(after))
    const { data, error } = await query
    if (error) return err(toAppError(error))
    const items: ActivityEvent[] = (data ?? []).map((r) => ({
      id: r.id,
      eventType: r.event_type,
      subjectType: r.subject_type,
      subjectId: r.subject_id,
      createdAt: r.created_at,
      actorName: (r as unknown as Named).actor?.display_name ?? null,
    }))
    return ok({ items, next: nextCursor(items) })
  }
}
