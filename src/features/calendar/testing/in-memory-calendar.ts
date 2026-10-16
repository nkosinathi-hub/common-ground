import { ok, type DateOnly, type Result } from "@/shared/domain"
import type { CalendarRepository, CalendarWindow } from "../application/ports"
import {
  coveredDays,
  type CalendarEntry,
  type CalendarEvent,
  type EventWrite,
  type RsvpAnswer,
} from "../domain"
import { entryOf, linked, missing } from "./entries"

/** Behaves like the adapter and the database rules the UI relies on, signed in as `me`. */
export class InMemoryCalendar implements CalendarRepository {
  readonly events = new Map<string, CalendarEvent>()
  /** Rows the range adds as if from other features (tasks due, milestones). */
  readonly extra: CalendarEntry[] = []
  readonly windows: [DateOnly, DateOnly][] = []
  private next = 0

  constructor(public me = "ana") {}

  async range(spaceId: string, from: DateOnly, to: DateOnly, zone: string) {
    this.windows.push([from, to])
    const inWindow = (entry: CalendarEntry) => {
      const [first, last] = coveredDays(entry.timing, zone)
      return first <= to && last >= from
    }
    const events = [...this.events.values()].filter((event) => event.spaceId === spaceId)
    const entries = [...events.map((event) => entryOf(event, this.me)), ...this.extra]
    return ok<CalendarWindow>({ entries: entries.filter(inWindow), truncated: false })
  }

  async get(id: string): Promise<Result<CalendarEvent>> {
    const event = this.events.get(id)
    return event ? ok(event) : missing()
  }

  async create(spaceId: string, write: EventWrite): Promise<Result<string>> {
    const id = `e${++this.next}`
    const { reminders, link, ...rest } = write
    this.events.set(id, {
      ...rest,
      id,
      spaceId,
      link: linked(link),
      defaultReminders: reminders,
      createdBy: this.me,
      attendees: [{ userId: this.me, rsvp: "going" }],
      myReminders: reminders,
    })
    return ok(id)
  }

  private change(id: string, patch: (event: CalendarEvent) => Partial<CalendarEvent>) {
    const event = this.events.get(id)
    if (!event) return missing()
    this.events.set(id, { ...event, ...patch(event) })
    return ok(undefined)
  }

  async update(id: string, write: EventWrite): Promise<Result<void>> {
    const { reminders, link, ...rest } = write
    return this.change(id, () => ({ ...rest, link: linked(link), defaultReminders: reminders }))
  }

  async remove(id: string): Promise<Result<void>> {
    return this.events.delete(id) ? ok(undefined) : missing()
  }

  async setAttendees(id: string, userIds: readonly string[]): Promise<Result<void>> {
    const wanted = [...new Set([this.me, ...userIds])]
    return this.change(id, (event) => ({
      attendees: wanted.map(
        (userId) => event.attendees.find((a) => a.userId === userId) ?? { userId, rsvp: "pending" },
      ),
    }))
  }

  async rsvp(id: string, answer: RsvpAnswer): Promise<Result<void>> {
    return this.change(id, (event) => ({
      attendees: [
        ...event.attendees.filter((a) => a.userId !== this.me),
        { userId: this.me, rsvp: answer },
      ],
    }))
  }

  async setMyReminders(id: string, minutes: readonly number[]): Promise<Result<void>> {
    return this.change(id, () => ({ myReminders: [...minutes] }))
  }
}
