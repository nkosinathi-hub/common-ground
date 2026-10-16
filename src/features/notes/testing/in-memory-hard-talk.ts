import { appError, err, ok, type Result } from "@/shared/domain"
import type {
  DraftRecord,
  DraftsRepository,
  HardTalkRepository,
  ResponseRecord,
} from "../application/hard-talk-ports"
import type { NoteRecord } from "../application/ports"
import { filledSections, type DraftFields, type RemindIn, type ResponseKind } from "../domain"
import type { NotesStore } from "./notes-store"

const missing = () => err(appError("not_found", "draft not found"))

/** Drafts visible to their author only, sent into the shared notes store like send_note_draft. */
export class InMemoryDrafts implements DraftsRepository {
  readonly rows: DraftRecord[] = []
  failSaves = false
  constructor(private readonly notes: NotesStore) {}

  private mine = (d: DraftRecord) => d.id.startsWith(`${this.notes.me}:`)

  async list(spaceId: string): Promise<Result<DraftRecord[]>> {
    return ok(this.rows.filter((d) => d.spaceId === spaceId && this.mine(d)))
  }
  async create(spaceId: string, fields: DraftFields): Promise<Result<DraftRecord>> {
    if (this.failSaves) return err(appError("network", "Could not reach the server"))
    if (this.rows.filter((d) => d.spaceId === spaceId && this.mine(d)).length >= 5)
      return err(appError("validation", "You have 5 drafts already"))
    const id = `${this.notes.me}:draft-${this.rows.length + 1}`
    const row = { ...fields, id, spaceId, updatedAt: this.notes.stamp() }
    this.rows.push(row)
    return ok(row)
  }
  async update(id: string, fields: DraftFields): Promise<Result<DraftRecord>> {
    if (this.failSaves) return err(appError("network", "Could not reach the server"))
    const at = this.rows.findIndex((d) => d.id === id && this.mine(d))
    if (at < 0) return missing()
    const row = { ...this.rows[at]!, ...fields, updatedAt: this.notes.stamp() }
    this.rows[at] = row
    return ok(row)
  }
  async remove(id: string): Promise<Result<void>> {
    const at = this.rows.findIndex((d) => d.id === id && this.mine(d))
    if (at >= 0) this.rows.splice(at, 1)
    return ok(undefined)
  }
  async send(id: string): Promise<Result<NoteRecord>> {
    const draft = this.rows.find((d) => d.id === id && this.mine(d))
    if (!draft) return missing()
    await this.remove(id)
    const { recipientId, responseWish, supportWish, spaceId } = draft
    const sections = Object.fromEntries(filledSections(draft.sections))
    const note = { id: `note-${this.notes.rows.length + 1}`, spaceId, authorId: this.notes.me }
    const stored = { ...note, recipientId, responseWish, supportWish, sections, body: "" }
    this.notes.rows.push({
      ...stored,
      kind: "hard_talk",
      pinned: false,
      expiresAt: null,
      createdAt: this.notes.stamp(),
    })
    this.notes.read(note.id)
    return ok(this.notes.record(this.notes.rows.at(-1)!))
  }
}

/** The recipient's side, like respond_to_note: responding reads the note; reminders are kept. */
export class InMemoryHardTalk implements HardTalkRepository {
  readonly reminders: { noteId: string; days: RemindIn }[] = []
  constructor(private readonly notes: NotesStore) {}

  async toMe(spaceId: string, me: string): Promise<Result<NoteRecord[]>> {
    const rows = this.notes.rows.filter(
      (n) => n.spaceId === spaceId && n.kind === "hard_talk" && n.recipientId === me,
    )
    return ok(rows.map((n) => this.notes.record(n)).reverse())
  }
  async respond(noteId: string, kind: ResponseKind, remindIn: RemindIn | null) {
    const note = this.notes.rows.find((n) => n.id === noteId && this.notes.visible(n))
    if (!note) return err(appError("not_found", "note not found"))
    if (note.recipientId !== this.notes.me)
      return err(appError("denied", "Only the person it was shared with can respond"))
    const response: ResponseRecord = { kind, createdAt: this.notes.stamp() }
    this.notes.responses.push({ noteId, ...response })
    this.notes.reads.set(`${noteId}:${this.notes.me}`, response.createdAt)
    if (remindIn) this.reminders.push({ noteId, days: remindIn })
    return ok(response)
  }
}
