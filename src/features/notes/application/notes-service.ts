import {
  asAuthors,
  ok,
  type AuthorDirectory,
  type MemberDirectory,
  type MemberRef,
  type Result,
} from "@/shared/domain"
import {
  expiresAt,
  recipientsFor,
  validateNote,
  type Expiry,
  type Note,
  type NoteReply,
} from "../domain"
import { toNote, toReply } from "./note-mapping"
import type { NoteCursor, NotesPage, NotesRepository } from "./ports"

export interface NoteDraft {
  readonly recipientId: string | null
  readonly body: string
  readonly pinned: boolean
  readonly expiry: Expiry
}

/** Notes to a member or to everyone on Home, with replies and read state. */
export class NotesService {
  constructor(
    private readonly repo: NotesRepository,
    private readonly directory: MemberDirectory,
    private readonly clock: () => Date,
    /** Names authors, including removed people still visible; current members by default. */
    private readonly names: AuthorDirectory = asAuthors(directory),
  ) {}

  /** Resolves names; a lookup failure falls back to "Former member" rather than hiding notes. */
  private async named<T, U>(spaceId: string, value: T, map: (m: MemberRef[], v: T) => U) {
    const people = await this.names.authors(spaceId)
    return map(people.ok ? people.value : [], value)
  }

  async recipients(spaceId: string, me: string): Promise<Result<MemberRef[]>> {
    const members = await this.directory.members(spaceId)
    return members.ok ? ok(recipientsFor(members.value, me)) : members
  }

  async forHome(spaceId: string, after: NoteCursor | null): Promise<Result<NotesPage<Note>>> {
    const page = await this.repo.home(spaceId, after, this.clock().toISOString())
    if (!page.ok) return page
    const items = await this.named(spaceId, page.value.items, (m, list) =>
      list.map((n) => toNote(m, n)),
    )
    return ok({ items, next: page.value.next })
  }

  async send(spaceId: string, draft: NoteDraft): Promise<Result<Note>> {
    const body = validateNote(draft.body)
    if (!body.ok) return body
    const expiry = expiresAt(draft.expiry, this.clock())
    const { recipientId, pinned } = draft
    const sent = await this.repo.post({
      spaceId,
      recipientId,
      body: body.value,
      pinned,
      expiresAt: expiry,
    })
    return sent.ok ? ok(await this.named(spaceId, sent.value, toNote)) : sent
  }

  async reply(spaceId: string, noteId: string, input: string): Promise<Result<NoteReply>> {
    const body = validateNote(input)
    if (!body.ok) return body
    const sent = await this.repo.reply(noteId, body.value)
    return sent.ok ? ok(await this.named(spaceId, sent.value, toReply)) : sent
  }

  async thread(spaceId: string, noteId: string): Promise<Result<NoteReply[]>> {
    const list = await this.repo.thread(noteId)
    if (!list.ok) return list
    return ok(await this.named(spaceId, list.value, (m, rows) => rows.map((r) => toReply(m, r))))
  }

  markRead = (noteId: string) => this.repo.markRead(noteId)

  takeBack = (noteId: string) => this.repo.remove(noteId)
}
