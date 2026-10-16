import { appError, err, ok, type Result } from "@/shared/domain"
import type { NoteKind, ResponseKind, ResponseWish, Sections, SupportWish } from "./hard-talk"

export const NOTE_MAX = 1000
/** Notes per page on the Home card. */
export const NOTES_PAGE_SIZE = 5

export type Recipient =
  | { readonly kind: "member"; readonly id: string; readonly name: string }
  | { readonly kind: "everyone" }

/** A note on Home, to one member or to everyone, as the signed-in member sees it. */
export interface Note {
  readonly id: string
  readonly spaceId: string
  readonly authorId: string | null
  readonly authorName: string
  readonly recipient: Recipient
  readonly body: string
  readonly pinned: boolean
  readonly expiresAt: string | null
  readonly replyCount: number
  /** When the newest reply was written; null without replies. */
  readonly lastReplyAt: string | null
  /** When the viewer last opened it; null if never. */
  readonly readAt: string | null
  readonly createdAt: string
  /** "hard_talk" is a "Something on my mind" note: sections, no body, never edited. */
  readonly kind: NoteKind
  readonly sections: Sections
  readonly responseWish: ResponseWish | null
  readonly supportWish: SupportWish | null
  /** The recipient's newest gentle response, if any. */
  readonly latestResponse: { readonly kind: ResponseKind; readonly at: string } | null
}

export interface NoteReply {
  readonly id: string
  readonly noteId: string
  readonly authorId: string | null
  readonly authorName: string
  readonly body: string
  readonly createdAt: string
}

/** Notes and replies share the server's 1 to 1000 character rule. */
export function validateNote(input: string): Result<string> {
  const body = input.trim()
  return body.length >= 1 && body.length <= NOTE_MAX
    ? ok(body)
    : err(appError("validation", `Notes are 1 to ${NOTE_MAX} characters`, "body"))
}

/** Unread until the viewer opens it, and again once someone replies after that. */
export function isUnread(note: Pick<Note, "readAt" | "lastReplyAt">): boolean {
  if (note.readAt === null) return true
  // Compared as instants: Postgres and the client format timestamps differently.
  return note.lastReplyAt !== null && Date.parse(note.lastReplyAt) > Date.parse(note.readAt)
}

const rank = (note: Note) => (note.pinned ? 0 : isUnread(note) ? 1 : 2)

/** Home order: pinned notes, then unread ones, then the newest. */
export const sortForHome = (notes: readonly Note[]): Note[] =>
  [...notes].sort(
    (a, b) =>
      rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
  )
