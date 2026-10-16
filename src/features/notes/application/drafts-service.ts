import { memberName, ok, type AuthorDirectory, type Result } from "@/shared/domain"
import { validateHardTalk, type Draft, type DraftFields, type Note } from "../domain"
import type { DraftRecord, DraftsRepository } from "./hard-talk-ports"
import { toNote, withNames } from "./note-mapping"

const named = (members: Parameters<typeof memberName>[0], d: DraftRecord): Draft => ({
  ...d,
  recipientName: d.recipientId === null ? null : memberName(members, d.recipientId),
})

/** The author's private "Something on my mind" drafts: saved as they type, sent when ready. */
export class DraftsService {
  constructor(
    private readonly repo: DraftsRepository,
    /** Names authors and recipients, including removed people still visible. */
    private readonly names: AuthorDirectory,
  ) {}

  async list(spaceId: string): Promise<Result<Draft[]>> {
    const rows = await this.repo.list(spaceId)
    if (!rows.ok) return rows
    return ok(await withNames(this.names, spaceId, rows.value, (m, l) => l.map((d) => named(m, d))))
  }

  /** Creates the draft on the first save and updates it after; returns its id. */
  async save(spaceId: string, id: string | null, fields: DraftFields): Promise<Result<string>> {
    const saved = id ? await this.repo.update(id, fields) : await this.repo.create(spaceId, fields)
    return saved.ok ? ok(saved.value.id) : saved
  }

  remove = (id: string) => this.repo.remove(id)

  /** Checks the draft as written, then sends the saved draft. */
  async send(spaceId: string, id: string, fields: DraftFields): Promise<Result<Note>> {
    const valid = validateHardTalk(fields.sections, fields.recipientId ?? "")
    if (!valid.ok) return valid
    const sent = await this.repo.send(id)
    return sent.ok ? ok(await withNames(this.names, spaceId, sent.value, toNote)) : sent
  }
}
