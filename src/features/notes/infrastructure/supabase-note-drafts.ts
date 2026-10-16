import type { Result } from "@/shared/domain"
import type { Tables } from "@/shared/infrastructure/database.types"
import { done, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { DraftRecord, DraftsRepository } from "../application/hard-talk-ports"
import type { NoteRecord } from "../application/ports"
import type { DraftFields } from "../domain"
import { toPosted, toSections } from "./note-rows"

export const DRAFT_COLUMNS =
  "id, space_id, recipient_id, sections, response_wish, support_wish, updated_at"
type DraftRow = Pick<
  Tables<"space_note_drafts">,
  "id" | "space_id" | "recipient_id" | "sections" | "response_wish" | "support_wish" | "updated_at"
>

const toDraft = (row: DraftRow): DraftRecord => ({
  id: row.id,
  spaceId: row.space_id,
  recipientId: row.recipient_id,
  sections: toSections(row.sections),
  responseWish: row.response_wish,
  supportWish: row.support_wish,
  updatedAt: row.updated_at,
})

const columns = (fields: DraftFields) => ({
  recipient_id: fields.recipientId,
  sections: fields.sections,
  response_wish: fields.responseWish,
  support_wish: fields.supportWish,
})

/** Direct writes under RLS: only the author can see or change their drafts. */
export class SupabaseNoteDrafts implements DraftsRepository {
  constructor(private readonly db: Db) {}

  list(spaceId: string): Promise<Result<DraftRecord[]>> {
    const query = this.db.from("space_note_drafts").select(DRAFT_COLUMNS).eq("space_id", spaceId)
    return settle(query.order("updated_at", { ascending: false }), (rows) => rows.map(toDraft))
  }

  create(spaceId: string, fields: DraftFields): Promise<Result<DraftRecord>> {
    const row = { space_id: spaceId, ...columns(fields) }
    const query = this.db.from("space_note_drafts").insert(row).select(DRAFT_COLUMNS).single()
    return settle(query, toDraft)
  }

  update(id: string, fields: DraftFields): Promise<Result<DraftRecord>> {
    const query = this.db.from("space_note_drafts").update(columns(fields)).eq("id", id)
    return settle(query.select(DRAFT_COLUMNS).single(), toDraft)
  }

  remove(id: string): Promise<Result<void>> {
    return done(this.db.from("space_note_drafts").delete().eq("id", id))
  }

  send(id: string): Promise<Result<NoteRecord>> {
    return settle(this.db.rpc("send_note_draft", { draft: id }), toPosted)
  }
}
