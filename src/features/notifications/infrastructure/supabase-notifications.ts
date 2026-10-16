import type { Cursor, Page, Result } from "@/shared/domain"
import { newestFirst, pageOf } from "@/shared/infrastructure/paging"
import { done, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { ActivityGateway, NotificationsGateway } from "../application/ports"
import type { ActivityEvent, Notification } from "../domain/notification"

const NOTE =
  "id, space_id, type, subject_type, subject_id, read_at, created_at, actor:profiles!notifications_actor_id_fkey(display_name)"
const EVENT =
  "id, event_type, subject_type, subject_id, created_at, actor:profiles!activity_events_actor_id_fkey(display_name)"

export class SupabaseNotifications implements NotificationsGateway {
  constructor(private readonly db: Db) {}

  list(after: Cursor | null): Promise<Result<Page<Notification>>> {
    const query = this.db.from("notifications").select(NOTE)
    return settle(
      newestFirst(query, after),
      pageOf((row) => ({
        id: row.id,
        spaceId: row.space_id,
        type: row.type,
        subjectType: row.subject_type,
        subjectId: row.subject_id,
        readAt: row.read_at,
        createdAt: row.created_at,
        actorName: row.actor?.display_name ?? null,
      })),
    )
  }

  markRead(ids: readonly string[], readAt: string): Promise<Result<void>> {
    return done(
      this.db
        .from("notifications")
        .update({ read_at: readAt })
        .in("id", [...ids]),
    )
  }

  markAllRead(readAt: string): Promise<Result<void>> {
    return done(this.db.from("notifications").update({ read_at: readAt }).is("read_at", null))
  }

  subscribe(onChange: () => void): () => void {
    const change = { event: "INSERT", schema: "public", table: "notifications" } as const
    const channel = this.db
      .channel(`notifications-${crypto.randomUUID()}`)
      .on("postgres_changes", change, onChange)
      .subscribe()
    return () => {
      // Fire and forget: the channel is gone for this client either way.
      void this.db.removeChannel(channel)
    }
  }
}

export class SupabaseActivity implements ActivityGateway {
  constructor(private readonly db: Db) {}

  list(spaceId: string, after: Cursor | null, size?: number): Promise<Result<Page<ActivityEvent>>> {
    const query = this.db.from("activity_events").select(EVENT).eq("space_id", spaceId)
    return settle(
      newestFirst(query, after, size),
      pageOf((row) => ({
        id: row.id,
        eventType: row.event_type,
        subjectType: row.subject_type,
        subjectId: row.subject_id,
        createdAt: row.created_at,
        actorName: row.actor?.display_name ?? null,
      })),
    )
  }
}
