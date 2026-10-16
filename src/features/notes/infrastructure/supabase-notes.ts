import type { Result } from "@/shared/domain"
import { done, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type {
  NewNote,
  NoteCursor,
  NoteRecord,
  NotesPage,
  NotesRepository,
  ReplyRecord,
} from "../application/ports"
import { NOTES_PAGE_SIZE } from "../domain"
import {
  HOME_COLUMNS,
  homeFilter,
  REPLY_COLUMNS,
  toPosted,
  toRecord,
  toReply,
  type HomeRow,
} from "./note-rows"

/** The reply cap reply_to_note enforces, so one request reads a whole thread. */
const THREAD_MAX = 200

const pageOf = (rows: HomeRow[]): NotesPage<NoteRecord> => {
  const items = rows.map(toRecord)
  const last = items.at(-1)
  const full = items.length >= NOTES_PAGE_SIZE && last
  return {
    items,
    next: full ? { pinned: last.pinned, createdAt: last.createdAt, id: last.id } : null,
  }
}

/** Generated RPC args are non-null strings, but post_note takes null for "everyone" and "never". */
const nullable = (value: string | null) => value as string

export class SupabaseNotes implements NotesRepository {
  constructor(private readonly db: Db) {}

  home(
    spaceId: string,
    after: NoteCursor | null,
    now: string,
  ): Promise<Result<NotesPage<NoteRecord>>> {
    const query = this.db
      .from("space_notes")
      .select(HOME_COLUMNS)
      .eq("space_id", spaceId)
      .or(homeFilter(now, after))
      .order("created_at", { referencedTable: "latest", ascending: false })
      .limit(1, { referencedTable: "latest" })
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(NOTES_PAGE_SIZE)
    return settle(query, pageOf)
  }

  post(note: NewNote): Promise<Result<NoteRecord>> {
    const args = {
      target_space: note.spaceId,
      recipient: nullable(note.recipientId),
      body: note.body,
      pinned: note.pinned,
      expires_at: nullable(note.expiresAt),
    }
    return settle(this.db.rpc("post_note", args), toPosted)
  }

  reply(noteId: string, body: string): Promise<Result<ReplyRecord>> {
    return settle(this.db.rpc("reply_to_note", { note: noteId, body }), toReply)
  }

  thread(noteId: string): Promise<Result<ReplyRecord[]>> {
    const query = this.db.from("space_note_replies").select(REPLY_COLUMNS).eq("note_id", noteId)
    return settle(query.order("created_at").order("id").limit(THREAD_MAX), (rows) =>
      rows.map(toReply),
    )
  }

  markRead(noteId: string): Promise<Result<void>> {
    return done(this.db.rpc("mark_note_read", { note: noteId }))
  }
}
