import type { DateOnly } from "@/shared/domain"
import type { LinkOption } from "../application/ports"
import { localDay, localTime, type CalendarEvent, type EventDraft } from "../domain"

/** The event dialog's inputs, kept as typed when a save fails. */
export class EventFormState {
  title = $state("")
  description = $state("")
  location = $state("")
  allDay = $state(false)
  startDate = $state("")
  endDate = $state("")
  startTime = $state("19:00")
  endTime = $state("20:00")
  timeZone = $state("UTC")
  repeatsYearly = $state(false)
  link = $state<LinkOption | null>(null)
  reminder = $state("60")
  attendees = $state<string[]>([])

  get canRepeat(): boolean {
    return this.allDay && this.startDate === this.endDate
  }

  reset(day: DateOnly, zone: string, memberIds: readonly string[]): void {
    Object.assign(this, { title: "", description: "", location: "", allDay: false })
    Object.assign(this, { startDate: day, endDate: day, startTime: "19:00", endTime: "20:00" })
    Object.assign(this, { timeZone: zone, repeatsYearly: false, link: null, reminder: "60" })
    this.attendees = [...memberIds]
  }

  fill(event: CalendarEvent): void {
    const { timing, timeZone: zone } = event
    Object.assign(this, { title: event.title, description: event.description })
    Object.assign(this, { location: event.location, timeZone: zone, allDay: timing.allDay })
    if (timing.allDay) Object.assign(this, { startDate: timing.startDate, endDate: timing.endDate })
    else {
      this.startDate = localDay(timing.startsAt, zone)
      this.endDate = localDay(timing.endsAt, zone)
      this.startTime = localTime(timing.startsAt, zone)
      this.endTime = localTime(timing.endsAt, zone)
    }
    this.repeatsYearly = event.repeatsYearly
    this.link = event.link && { kind: event.link.kind, id: event.link.id, label: event.link.label }
    this.reminder = event.defaultReminders.length ? String(event.defaultReminders[0]) : "none"
    this.attendees = event.attendees.map((a) => a.userId)
  }

  /** Moving the start past the end takes the end along. */
  setStartDate(value: string): void {
    this.startDate = value
    if (this.endDate < value) this.endDate = value
  }

  planWatchNight(title: LinkOption): void {
    this.title = `Watch night: ${title.label}`
    this.link = title
    Object.assign(this, { allDay: false, startTime: "20:00", endTime: "22:00" })
  }

  /** Every year means a single all-day date, such as a birthday. */
  setYearly(on: boolean): void {
    if (on) Object.assign(this, { allDay: true, endDate: this.startDate })
    this.repeatsYearly = on
  }

  toggleAttendee(userId: string, on: boolean): void {
    const others = this.attendees.filter((id) => id !== userId)
    this.attendees = on ? [...others, userId] : others
  }

  toDraft(): EventDraft {
    return {
      title: this.title,
      description: this.description,
      location: this.location,
      allDay: this.allDay,
      startDate: this.startDate,
      endDate: this.endDate,
      startTime: this.startTime,
      endTime: this.endTime,
      timeZone: this.timeZone,
      repeatsYearly: this.repeatsYearly && this.canRepeat,
      link: this.link && { kind: this.link.kind, id: this.link.id },
      reminders: this.reminder === "none" ? [] : [Number(this.reminder)],
    }
  }
}
