import type { Result } from "@/shared/domain"
import { settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { HardTalkRepository, ResponseRecord } from "../application/hard-talk-ports"
import type { NoteRecord } from "../application/ports"
import type { RemindIn, ResponseKind } from "../domain"
import { HOME_COLUMNS, toRecord } from "./note-rows"

/** How many unopened notes the top of Home looks through. */
const WAITING_MAX = 20

/** Generated RPC args are non-null, but respond_to_note takes null for "no reminder". */
const nullable = (value: RemindIn | null) => value as number

export class SupabaseHardTalk implements HardTalkRepository {
  constructor(private readonly db: Db) {}

  toMe(spaceId: string, me: string): Promise<Result<NoteRecord[]>> {
    const query = this.db
      .from("space_notes")
      .select(HOME_COLUMNS)
      .eq("space_id", spaceId)
      .eq("kind", "hard_talk")
      .eq("recipient_id", me)
      .order("created_at", { referencedTable: "latest", ascending: false })
      .limit(1, { referencedTable: "latest" })
      .order("created_at", { referencedTable: "responses", ascending: false })
      .limit(1, { referencedTable: "responses" })
      .order("created_at", { ascending: false })
      .limit(WAITING_MAX)
    return settle(query, (rows) => rows.map(toRecord))
  }

  respond(
    noteId: string,
    kind: ResponseKind,
    remindIn: RemindIn | null,
  ): Promise<Result<ResponseRecord>> {
    const args = { note: noteId, kind, remind_in_days: nullable(remindIn) }
    return settle(this.db.rpc("respond_to_note", args), (row) => ({
      kind: row.kind,
      createdAt: row.created_at,
    }))
  }
}
