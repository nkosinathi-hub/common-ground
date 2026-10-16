import type { DateOnly, Result } from "@/shared/domain"
import type { CalendarEntry, CalendarEvent, EventWrite, LinkKind, RsvpAnswer } from "../domain"

/** One window of calendar rows; truncated when the server hit its row limit. */
export interface CalendarWindow {
  readonly entries: readonly CalendarEntry[]
  readonly truncated: boolean
}

export interface CalendarRepository {
  /** list_calendar: local days from..to inclusive (at most 92 days apart) in `zone`. */
  range(
    spaceId: string,
    from: DateOnly,
    to: DateOnly,
    zone: string,
  ): Promise<Result<CalendarWindow>>
  get(id: string): Promise<Result<CalendarEvent>>
  /** Returns the new event's id. The creator is added as going, with the default reminders. */
  create(spaceId: string, event: EventWrite): Promise<Result<string>>
  update(id: string, event: EventWrite): Promise<Result<void>>
  remove(id: string): Promise<Result<void>>
  setAttendees(id: string, userIds: readonly string[]): Promise<Result<void>>
  rsvp(id: string, answer: RsvpAnswer): Promise<Result<void>>
  setMyReminders(id: string, minutes: readonly number[]): Promise<Result<void>>
}

/** Something an event can link to, as a picker shows it. */
export interface LinkOption {
  readonly kind: LinkKind
  readonly id: string
  readonly label: string
}

/**
 * Finds watch items, ideas and tasks to link. Implemented in src/app/composition over the other
 * features' services, so the calendar never reaches into their storage.
 */
export interface LinkSearch {
  search(spaceId: string, kind: LinkKind, query: string): Promise<Result<LinkOption[]>>
  /** The watch-together queue, for planning a watch night. */
  watchNight(spaceId: string): Promise<Result<LinkOption[]>>
}
