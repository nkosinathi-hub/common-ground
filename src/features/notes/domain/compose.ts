import type { MemberRef } from "@/shared/domain"
import type { Note } from "./note"

export const EXPIRY_CHOICES = [
  { value: "never", label: "Never", days: null },
  { value: "day", label: "In a day", days: 1 },
  { value: "week", label: "In a week", days: 7 },
  { value: "month", label: "In 30 days", days: 30 },
] as const
export type Expiry = (typeof EXPIRY_CHOICES)[number]["value"]

const DAY_MS = 24 * 60 * 60 * 1000

/** The expiry instant for a choice; the server allows at most 90 days. */
export function expiresAt(choice: Expiry, now: Date): string | null {
  const days = EXPIRY_CHOICES.find((c) => c.value === choice)?.days ?? null
  return days === null ? null : new Date(now.getTime() + days * DAY_MS).toISOString()
}

/** A note goes to another member or to everyone, never to yourself. */
export const recipientsFor = (members: readonly MemberRef[], me: string): MemberRef[] =>
  members.filter((member) => member.id !== me)

/** "Ana to you", "You to Ben", "Ana to everyone": the note's people from the viewer's side. */
export function whoToWhom(note: Pick<Note, "authorId" | "authorName" | "recipient">, me: string) {
  const from = note.authorId === me ? "You" : note.authorName
  if (note.recipient.kind === "everyone") return `${from} to everyone`
  return `${from} to ${note.recipient.id === me ? "you" : note.recipient.name}`
}
