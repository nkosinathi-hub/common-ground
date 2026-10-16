import type { DateOnly } from "@/shared/domain"

export type Rsvp = "pending" | "going" | "maybe" | "declined"

/** All-day events are dates (inclusive) and never move; timed events are instants (ADR 0008). */
export type EventTiming =
  | { readonly allDay: true; readonly startDate: DateOnly; readonly endDate: DateOnly }
  | { readonly allDay: false; readonly startsAt: string; readonly endsAt: string }

export const LINK_KINDS = ["watch_item", "idea", "task"] as const
export type LinkKind = (typeof LINK_KINDS)[number]

export interface LinkRef {
  readonly kind: LinkKind
  readonly id: string
}

/** A linked item as shown: tasks carry their idea so the link can open its tasks tab. */
export interface EventLink extends LinkRef {
  readonly label: string
  readonly ideaId: string | null
}

export interface Attendee {
  readonly userId: string
  readonly rsvp: Rsvp
}

export interface CalendarEvent {
  readonly id: string
  readonly spaceId: string
  readonly title: string
  readonly description: string
  readonly location: string
  /** The zone it was planned in: shown when it differs from the viewer's. */
  readonly timeZone: string
  readonly timing: EventTiming
  readonly repeatsYearly: boolean
  readonly link: EventLink | null
  /** Minutes before the start that new attendees are reminded. */
  readonly defaultReminders: readonly number[]
  readonly createdBy: string | null
  readonly attendees: readonly Attendee[]
  /** The viewer's own reminders; nobody sees anyone else's. */
  readonly myReminders: readonly number[]
}

/** What the event form submits, as typed. */
export interface EventDraft {
  readonly title: string
  readonly description: string
  readonly location: string
  readonly allDay: boolean
  readonly startDate: string
  readonly endDate: string
  readonly startTime: string
  readonly endTime: string
  readonly timeZone: string
  readonly repeatsYearly: boolean
  readonly link: LinkRef | null
  readonly reminders: readonly number[]
}

/** A checked draft, ready to store. */
export interface EventWrite {
  readonly title: string
  readonly description: string
  readonly location: string
  readonly timeZone: string
  readonly timing: EventTiming
  readonly repeatsYearly: boolean
  readonly link: LinkRef | null
  readonly reminders: readonly number[]
}
