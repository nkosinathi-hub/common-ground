import type { Tables } from "@/shared/infrastructure/database.types"
import type { NoteCursor, NoteRecord, ReplyRecord } from "../application/ports"

type NoteTable = Tables<"space_notes">
export type ReplyRow = Pick<
  Tables<"space_note_replies">,
  "id" | "note_id" | "author_id" | "body" | "created_at"
>
export type HomeRow = Omit<NoteTable, "updated_at"> & {
  readonly space_note_replies: readonly { readonly count: number }[]
  readonly space_note_reads: readonly { readonly read_at: string }[]
  readonly latest: readonly { readonly created_at: string }[]
}

/** Reads are the caller's own (RLS); `latest` is the newest reply, limited to one in the query. */
export const HOME_COLUMNS =
  "id, space_id, author_id, recipient_id, body, pinned, expires_at, created_at, space_note_replies(count), space_note_reads(read_at), latest:space_note_replies(created_at)"
export const REPLY_COLUMNS = "id, note_id, author_id, body, created_at"

const base = (row: Omit<NoteTable, "updated_at">) => ({
  id: row.id,
  spaceId: row.space_id,
  authorId: row.author_id,
  recipientId: row.recipient_id,
  body: row.body,
  pinned: row.pinned,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
})

export const toRecord = (row: HomeRow): NoteRecord => ({
  ...base(row),
  replyCount: row.space_note_replies[0]?.count ?? 0,
  lastReplyAt: row.latest[0]?.created_at ?? null,
  readAt: row.space_note_reads[0]?.read_at ?? null,
})

/** A note just posted: post_note records the author's read, and there are no replies yet. */
export const toPosted = (row: NoteTable): NoteRecord => ({
  ...base(row),
  replyCount: 0,
  lastReplyAt: null,
  readAt: row.created_at,
})

export const toReply = (row: ReplyRow): ReplyRecord => ({
  id: row.id,
  noteId: row.note_id,
  authorId: row.author_id,
  body: row.body,
  createdAt: row.created_at,
})

const q = (value: string) => `"${value}"`

/** Not expired at `now`, and (when paging) after the cursor in pinned, created_at, id order. */
export function homeFilter(now: string, after: NoteCursor | null): string {
  const live = `or(expires_at.is.null,expires_at.gt.${q(now)})`
  if (!after) return live.slice(3, -1)
  const at = q(after.createdAt)
  const older = `created_at.lt.${at},and(created_at.eq.${at},id.lt.${after.id})`
  const later = after.pinned
    ? `or(pinned.eq.false,and(pinned.eq.true,or(${older})))`
    : `and(pinned.eq.false,or(${older}))`
  return `and(${live},${later})`
}
