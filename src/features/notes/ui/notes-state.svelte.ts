import type { AppError, Result } from "@/shared/domain"
import { PagedList } from "@/shared/ui"
import type { HardTalkService } from "../application/hard-talk-service"
import type { NoteDraft, NotesService } from "../application/notes-service"
import type { NoteCursor } from "../application/ports"
import { sortForHome, type Note, type NoteReply, type RemindIn, type ResponseKind } from "../domain"

/** Read at least as late as the newest reply, so a slow client clock never leaves it unread. */
const readNow = (note: Note, at = new Date().toISOString()) =>
  note.lastReplyAt && Date.parse(note.lastReplyAt) > Date.parse(at) ? note.lastReplyAt : at

/** The Home card's notes: paged in server order, shown pinned, unread, then newest. */
export class NotesState {
  readonly list: PagedList<Note, NoteCursor>
  visible = $derived.by(() => sortForHome(this.list.items))

  constructor(
    private readonly service: NotesService,
    private readonly spaceId: () => string,
    private readonly hardTalk?: HardTalkService,
  ) {
    this.list = new PagedList((after) => service.forHome(spaceId(), after))
  }

  load = () => this.list.load()

  send(draft: NoteDraft): Promise<AppError | null> {
    return this.list.add(this.service.send(this.spaceId(), draft))
  }

  /** Shows a note sent some other way (a draft sent from the composer). */
  added = (write: Promise<Result<Note>>) => this.list.add(write)

  takeBack = (note: Note) => this.list.remove(note.id, this.service.takeBack(note.id))

  /** Optimistic: shows the response and reads the note at once, and reloads if it fails. */
  async respond(note: Note, kind: ResponseKind, remindIn: RemindIn | null = null) {
    this.update(note.id, (n) => {
      const at = readNow(n)
      return { ...n, readAt: at, latestResponse: { kind, at } }
    })
    const sent = await this.hardTalk!.respond(note.id, kind, remindIn)
    if (sent.ok) return null
    await this.load()
    return sent.error
  }

  private update(id: string, change: (note: Note) => Note) {
    this.list.items = this.list.items.map((note) => (note.id === id ? change(note) : note))
  }

  async markRead(note: Note): Promise<void> {
    this.update(note.id, (n) => ({ ...n, readAt: readNow(n) }))
    const marked = await this.service.markRead(note.id)
    if (!marked.ok) await this.load()
  }

  thread = (note: Note) => this.service.thread(this.spaceId(), note.id)

  async reply(note: Note, body: string): Promise<Result<NoteReply>> {
    const sent = await this.service.reply(this.spaceId(), note.id, body)
    if (sent.ok) {
      const at = sent.value.createdAt
      this.update(note.id, (n) => ({
        ...n,
        replyCount: n.replyCount + 1,
        lastReplyAt: at,
        readAt: at,
      }))
    }
    return sent
  }
}
