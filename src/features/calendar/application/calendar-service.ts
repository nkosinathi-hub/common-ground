import {
  appError,
  err,
  ok,
  type DateOnly,
  type MemberDirectory,
  type Result,
} from "@/shared/domain"
import {
  addDays,
  daysBetween,
  REMINDERS_MAX,
  REMINDER_MINUTES,
  validateEvent,
  type CalendarEntry,
  type EventDraft,
  type LinkKind,
  type RsvpAnswer,
} from "../domain"
import type { CalendarRepository, CalendarWindow, LinkSearch } from "./ports"

/** The widest window list_calendar answers: to_date - from_date. */
export const WINDOW_DAYS_MAX = 92

/** Events, attendance and reminders; drafts are validated before they reach storage. */
export class CalendarService {
  constructor(
    private readonly repo: CalendarRepository,
    private readonly links: LinkSearch,
    private readonly directory: MemberDirectory,
  ) {}

  members = (spaceId: string) => this.directory.members(spaceId)
  get = (id: string) => this.repo.get(id)
  remove = (id: string) => this.repo.remove(id)
  rsvp = (id: string, answer: RsvpAnswer) => this.repo.rsvp(id, answer)
  linkSearch = (spaceId: string, kind: LinkKind, query: string) =>
    this.links.search(spaceId, kind, query.trim())
  watchNight = (spaceId: string) => this.links.watchNight(spaceId)

  /** Any range, read in windows the server accepts. */
  async range(
    spaceId: string,
    from: DateOnly,
    to: DateOnly,
    zone: string,
  ): Promise<Result<CalendarWindow>> {
    const entries: CalendarEntry[] = []
    let truncated = false
    for (let start = from; daysBetween(start, to) >= 0;) {
      const end = daysBetween(start, to) > WINDOW_DAYS_MAX ? addDays(start, WINDOW_DAYS_MAX) : to
      const window = await this.repo.range(spaceId, start, end, zone)
      if (!window.ok) return window
      entries.push(...window.value.entries)
      truncated ||= window.value.truncated
      start = addDays(end, 1)
    }
    return ok({ entries, truncated })
  }

  /** Events and occasions over the seven days from `today`, for the Home card. */
  async week(spaceId: string, today: DateOnly, zone: string): Promise<Result<CalendarEntry[]>> {
    const window = await this.range(spaceId, today, addDays(today, 6), zone)
    if (!window.ok) return window
    return ok(window.value.entries.filter((e) => e.kind === "event" || e.kind === "occasion"))
  }

  async create(spaceId: string, draft: EventDraft, attendees: readonly string[]) {
    const valid = validateEvent(draft)
    if (!valid.ok) return valid
    const created = await this.repo.create(spaceId, valid.value)
    if (!created.ok) return created
    const invited = await this.repo.setAttendees(created.value, attendees)
    return invited.ok ? created : invited
  }

  /** Saves the event; when `attendees` is given, the invite list is synced too. */
  async update(id: string, draft: EventDraft, attendees?: readonly string[]) {
    const valid = validateEvent(draft)
    if (!valid.ok) return valid
    const saved = await this.repo.update(id, valid.value)
    if (!saved.ok || !attendees) return saved
    return this.repo.setAttendees(id, attendees)
  }

  async setMyReminders(id: string, minutes: readonly number[]): Promise<Result<void>> {
    const unique = [...new Set(minutes)]
    const offered = (m: number) => (REMINDER_MINUTES as readonly number[]).includes(m)
    if (unique.length > REMINDERS_MAX || !unique.every(offered))
      return err(appError("validation", "Choose up to three of the offered reminders", "reminders"))
    return this.repo.setMyReminders(id, unique)
  }
}
