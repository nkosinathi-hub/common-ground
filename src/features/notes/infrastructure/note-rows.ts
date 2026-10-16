import type { Json, Tables } from "@/shared/infrastructure/database.types"
import type { NoteRecord, ReplyRecord } from "../application/ports"
import { SECTION_KEYS, type Sections } from "../domain"

type NoteTable = Tables<"space_notes">
type NoteRow = Omit<NoteTable, "updated_at">
export type ReplyRow = Pick<
  Tables<"space_note_replies">,
  "id" | "note_id" | "author_id" | "body" | "created_at"
>
type ResponseRow = Pick<Tables<"space_note_responses">, "kind" | "created_at">
export type HomeRow = NoteRow & {
  readonly space_note_replies: readonly { readonly count: number }[]
  readonly space_note_reads: readonly { readonly read_at: string }[]
  readonly latest: readonly { readonly created_at: string }[]
  readonly responses: readonly ResponseRow[]
}

/**
 * Reads are the caller's own (RLS); `latest` is the newest reply and `responses` the newest
 * gentle response, each limited to one in the query.
 */
export const HOME_COLUMNS =
  "id, space_id, author_id, recipient_id, body, pinned, expires_at, created_at, kind, sections, response_wish, support_wish, space_note_replies(count), space_note_reads(read_at), latest:space_note_replies(created_at), responses:space_note_responses(kind, created_at)"
export const REPLY_COLUMNS = "id, note_id, author_id, body, created_at"

/** Only the four known parts, as text. */
export function toSections(value: Json): Sections {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const parts = SECTION_KEYS.flatMap((key) => {
    const text = value[key]
    return typeof text === "string" ? [[key, text] as const] : []
  })
  return Object.fromEntries(parts)
}

const toBase = (row: NoteRow) => ({
  id: row.id,
  spaceId: row.space_id,
  authorId: row.author_id,
  recipientId: row.recipient_id,
  body: row.body,
  pinned: row.pinned,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
  kind: row.kind,
  sections: toSections(row.sections),
  responseWish: row.response_wish,
  supportWish: row.support_wish,
})

export const toRecord = (row: HomeRow): NoteRecord => {
  const response = row.responses[0]
  return {
    ...toBase(row),
    replyCount: row.space_note_replies[0]?.count ?? 0,
    lastReplyAt: row.latest[0]?.created_at ?? null,
    readAt: row.space_note_reads[0]?.read_at ?? null,
    latestResponse: response ? { kind: response.kind, at: response.created_at } : null,
  }
}

/** A note just sent: the RPC records the author's read, and there are no replies yet. */
export const toPosted = (row: NoteTable): NoteRecord => ({
  ...toBase(row),
  replyCount: 0,
  lastReplyAt: null,
  readAt: row.created_at,
  latestResponse: null,
})

export const toReply = (row: ReplyRow): ReplyRecord => ({
  id: row.id,
  noteId: row.note_id,
  authorId: row.author_id,
  body: row.body,
  createdAt: row.created_at,
})
