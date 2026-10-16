import type { Result } from "@/shared/domain"

/** Keyset position in the Home order: pinned first, then newest. */
export interface NoteCursor {
  readonly pinned: boolean
  readonly createdAt: string
  readonly id: string
}

/** A note as stored, before names are resolved. recipientId null means everyone. */
export interface NoteRecord {
  readonly id: string
  readonly spaceId: string
  readonly authorId: string | null
  readonly recipientId: string | null
  readonly body: string
  readonly pinned: boolean
  readonly expiresAt: string | null
  readonly replyCount: number
  readonly lastReplyAt: string | null
  readonly readAt: string | null
  readonly createdAt: string
}

export interface ReplyRecord {
  readonly id: string
  readonly noteId: string
  readonly authorId: string | null
  readonly body: string
  readonly createdAt: string
}

export interface NewNote {
  readonly spaceId: string
  readonly recipientId: string | null
  readonly body: string
  readonly pinned: boolean
  readonly expiresAt: string | null
}

export interface NotesPage<T> {
  readonly items: readonly T[]
  readonly next: NoteCursor | null
}

/** The server decides visibility: a note shows to its recipient, its author, or everyone. */
export interface NotesRepository {
  /** Notes that have not expired by `now`, pinned first, then newest. */
  home(
    spaceId: string,
    after: NoteCursor | null,
    now: string,
  ): Promise<Result<NotesPage<NoteRecord>>>
  post(note: NewNote): Promise<Result<NoteRecord>>
  reply(noteId: string, body: string): Promise<Result<ReplyRecord>>
  thread(noteId: string): Promise<Result<ReplyRecord[]>>
  markRead(noteId: string): Promise<Result<void>>
}

/** Tells Home that a note or a reply to one has arrived for the signed-in member. */
export interface NoteArrivals {
  subscribe(onArrival: () => void): () => void
}
