import { ok, type MemberDirectory, type Result } from "@/shared/domain"
import { isWaitingFor, type Note, type RemindIn, type ResponseKind } from "../domain"
import type { HardTalkRepository, ResponseRecord } from "./hard-talk-ports"
import { toNote, withNames } from "./note-mapping"

/** "Something on my mind" notes from the reader's side: what waits for them, and responding. */
export class HardTalkService {
  constructor(
    private readonly repo: HardTalkRepository,
    private readonly directory: MemberDirectory,
  ) {}

  /** Notes shared with `me` that they have not opened yet, for the top of Home. */
  async waiting(spaceId: string, me: string): Promise<Result<Note[]>> {
    const rows = await this.repo.toMe(spaceId, me)
    if (!rows.ok) return rows
    const notes = await withNames(this.directory, spaceId, rows.value, (m, list) =>
      list.map((n) => toNote(m, n)),
    )
    return ok(notes.filter((note) => isWaitingFor(note, me)))
  }

  respond(
    noteId: string,
    kind: ResponseKind,
    remindIn: RemindIn | null = null,
  ): Promise<Result<ResponseRecord>> {
    return this.repo.respond(noteId, kind, remindIn)
  }
}
