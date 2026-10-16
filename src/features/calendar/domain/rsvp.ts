import type { Attendee, Rsvp } from "./types"

export const RSVP_ANSWERS = ["going", "maybe", "declined"] as const
export type RsvpAnswer = (typeof RSVP_ANSWERS)[number]

export interface RsvpSummary {
  readonly going: string[]
  readonly maybe: string[]
  readonly declined: string[]
  readonly pending: string[]
  readonly mine: Rsvp | null
}

/** Who answered what, by name, and the viewer's own answer (null when not invited). */
export function rsvpSummary(
  attendees: readonly Attendee[],
  me: string,
  nameOf: (userId: string) => string,
): RsvpSummary {
  const summary: RsvpSummary = { going: [], maybe: [], declined: [], pending: [], mine: null }
  for (const attendee of attendees) summary[attendee.rsvp].push(nameOf(attendee.userId))
  const mine = attendees.find((attendee) => attendee.userId === me)?.rsvp ?? null
  return { ...summary, mine }
}
