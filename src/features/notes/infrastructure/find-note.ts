import { appError, err, type Result } from "@/shared/domain"
import { settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { NoteRecord } from "../application/ports"
import { homeFilter, newestEmbeds } from "./home-filter"
import { HOME_COLUMNS, toRecord } from "./note-rows"

/** A deep link uses the same RLS, expiry and embedded data as the notes list. */
export async function findNote(
  db: Db,
  spaceId: string,
  noteId: string,
  now: string,
): Promise<Result<NoteRecord>> {
  const found = await settle(
    newestEmbeds(
      db
        .from("space_notes")
        .select(HOME_COLUMNS)
        .eq("space_id", spaceId)
        .eq("id", noteId)
        .or(homeFilter(now, null)),
    ).limit(1),
    (rows) => (rows[0] ? toRecord(rows[0]) : null),
  )
  if (!found.ok) return found
  return found.value
    ? { ok: true, value: found.value }
    : err(appError("not_found", "This note is no longer available"))
}
