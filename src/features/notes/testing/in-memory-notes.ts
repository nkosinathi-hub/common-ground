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
import { NotesStore, type Stored } from "./notes-store"

const PLAIN = { kind: "note", sections: {}, responseWish: null, supportWish: null } as const

/** Mirrors the notes RLS and RPCs: visibility per viewer, read rows, Home order and paging. */
export class InMemoryNotes extends NotesStore implements NotesRepository {
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
      ...PLAIN,
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

  async remove(noteId: string): Promise<Result<void>> {
    const at = this.rows.findIndex((n) => n.id === noteId && n.authorId === this.me)
    if (at >= 0) this.rows.splice(at, 1)
    return ok(undefined)
  }
}
