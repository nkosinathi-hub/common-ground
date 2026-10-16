import { appError, err, ok, type Result } from "@/shared/domain"
import type {
  NewNote,
  NoteCursor,
  NoteRecord,
  NotesPage,
  NotesRepository,
  ReplyRecord,
} from "../application/ports"
import { NOTES_PAGE_SIZE } from "../domain"

type Stored = Omit<NoteRecord, "readAt" | "replyCount" | "lastReplyAt">

/** Mirrors the notes RLS and RPCs: visibility per viewer, read rows, Home order and paging. */
export class InMemoryNotes implements NotesRepository {
  me = "ana"
  readonly rows: Stored[] = []
  readonly replies: ReplyRecord[] = []
  readonly reads = new Map<string, string>()
  private tick = 0

  private stamp() {
    this.tick += 1
    return new Date(Date.UTC(2026, 9, 16, 9, 0, this.tick)).toISOString()
  }
  private visible = (n: Stored) =>
    n.recipientId === null || n.recipientId === this.me || n.authorId === this.me
  private read(noteId: string) {
    this.reads.set(`${noteId}:${this.me}`, this.stamp())
  }
  private record(n: Stored): NoteRecord {
    const thread = this.replies.filter((r) => r.noteId === n.id)
    const readAt = this.reads.get(`${n.id}:${this.me}`) ?? null
    return {
      ...n,
      readAt,
      replyCount: thread.length,
      lastReplyAt: thread.at(-1)?.createdAt ?? null,
    }
  }

  async home(
    spaceId: string,
    after: NoteCursor | null,
    now: string,
  ): Promise<Result<NotesPage<NoteRecord>>> {
    const order = (n: Stored) => `${n.pinned ? 1 : 0}|${n.createdAt}|${n.id}`
    const all = this.rows
      .filter(
        (n) => n.spaceId === spaceId && this.visible(n) && (!n.expiresAt || n.expiresAt > now),
      )
      .sort((a, b) => order(b).localeCompare(order(a)))
    const start = after ? all.findIndex((n) => n.id === after.id) + 1 : 0
    const items = all.slice(start, start + NOTES_PAGE_SIZE).map((n) => this.record(n))
    const last = items.at(-1)
    const next = items.length === NOTES_PAGE_SIZE && last ? { ...last } : null
    return ok({ items, next })
  }

  async post(note: NewNote): Promise<Result<NoteRecord>> {
    const stored = {
      ...note,
      id: `note-${this.rows.length + 1}`,
      authorId: this.me,
      createdAt: this.stamp(),
    }
    this.rows.push(stored)
    this.read(stored.id)
    return ok(this.record(stored))
  }

  async reply(noteId: string, body: string): Promise<Result<ReplyRecord>> {
    if (!this.rows.some((n) => n.id === noteId && this.visible(n)))
      return err(appError("not_found", "note not found"))
    const reply = {
      id: `reply-${this.replies.length + 1}`,
      noteId,
      authorId: this.me,
      body,
      createdAt: this.stamp(),
    }
    this.replies.push(reply)
    this.read(noteId)
    return ok(reply)
  }

  async thread(noteId: string): Promise<Result<ReplyRecord[]>> {
    return ok(this.replies.filter((r) => r.noteId === noteId))
  }

  async markRead(noteId: string): Promise<Result<void>> {
    this.read(noteId)
    return ok(undefined)
  }
}
