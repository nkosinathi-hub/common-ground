import { appError, err, ok, type DateOnly, type Result } from "@/shared/domain"
import { done, removed, settle } from "@/shared/infrastructure/query"
import { toAppError } from "@/shared/infrastructure/errors"
import type { Db } from "@/shared/infrastructure/supabase"
import type { CalendarRepository, CalendarWindow } from "../application/ports"
import type { CalendarEvent, EventWrite, RsvpAnswer } from "../domain"
import * as rows from "./rows"

/** list_calendar answers at most this many rows; a full answer was cut short. */
export const ROW_LIMIT = 1000

export class SupabaseCalendar implements CalendarRepository {
  constructor(private readonly db: Db) {}

  private get events() {
    return this.db.from("calendar_events")
  }

  range(spaceId: string, from: DateOnly, to: DateOnly, zone: string) {
    const args = { target_space: spaceId, from_date: from, to_date: to, tz: zone }
    return settle(this.db.rpc("list_calendar", args), (data): CalendarWindow => ({
      entries: data.map(rows.toEntry),
      truncated: data.length >= ROW_LIMIT,
    }))
  }

  get(id: string): Promise<Result<CalendarEvent>> {
    const query = this.events.select(rows.EVENT_COLUMNS).eq("id", id).single()
    return settle(query, (data) => rows.toEvent(data as unknown as rows.EventRow))
  }

  create(spaceId: string, event: EventWrite): Promise<Result<string>> {
    const row = { space_id: spaceId, ...rows.writeRow(event) }
    return settle(
      this.events.insert(row).select("id").single(),
      (data: unknown) => (data as { id: string }).id,
    )
  }

  /** RLS hides events of other spaces, so no row back means it is gone or not ours to see. */
  async update(id: string, event: EventWrite): Promise<Result<void>> {
    const { data, error } = await this.events.update(rows.writeRow(event)).eq("id", id).select("id")
    if (error) return err(toAppError(error))
    if (!data?.length) return err(appError("not_found", "This event was deleted"))
    return ok(undefined)
  }

  remove(id: string): Promise<Result<void>> {
    return removed(this.events.delete().eq("id", id).select("id"))
  }

  setAttendees(id: string, userIds: readonly string[]): Promise<Result<void>> {
    return done(this.db.rpc("set_event_attendees", { event: id, members: [...userIds] }))
  }

  rsvp(id: string, answer: RsvpAnswer): Promise<Result<void>> {
    return done(this.db.rpc("rsvp_event", { event: id, response: answer }))
  }

  setMyReminders(id: string, minutes: readonly number[]): Promise<Result<void>> {
    return done(this.db.rpc("set_my_event_reminders", { event: id, minutes: [...minutes] }))
  }
}
