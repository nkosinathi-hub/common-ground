import type { AppError, Result } from "@/shared/domain"
import { PagedList } from "@/shared/ui"
import type { NoteDraft, NotesService } from "../application/notes-service"
import type { NoteCursor } from "../application/ports"
import { sortForHome, type Note, type NoteReply } from "../domain"

/** Read at least as late as the newest reply, so a slow client clock never leaves it unread. */
const readNow = (note: Note, at = new Date().toISOString()) =>
  note.lastReplyAt && note.lastReplyAt > at ? note.lastReplyAt : at

/** The Home card's notes: paged in server order, shown pinned, unread, then newest. */
export class NotesState {
  readonly list: PagedList<Note, NoteCursor>
  visible = $derived.by(() => sortForHome(this.list.items))

  constructor(
    private readonly service: NotesService,
    private readonly spaceId: () => string,
  ) {
    this.list = new PagedList((after) => service.forHome(spaceId(), after))
  }

  load = () => this.list.load()

  send(draft: NoteDraft): Promise<AppError | null> {
    return this.list.add(this.service.send(this.spaceId(), draft))
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
