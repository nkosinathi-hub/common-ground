import { appError, err, ok, type AppError, type DateOnly, type Result } from "@/shared/domain"
import type { Tables } from "@/shared/infrastructure/database.types"
import { toAppError } from "@/shared/infrastructure/errors"
import type { QueryError, QueryReply } from "@/shared/infrastructure/query"
import { progressStatusOf } from "../domain/labels"
import { parsePlaces, parseTogether } from "../domain/places"
import type * as T from "../domain/types"

type Item = Tables<"watch_items">

/** A watch_items row as selected by ITEM_COLUMNS, or as returned by list_watch_items. */
export type WatchItemRow = Pick<
  Item,
  | "id"
  | "space_id"
  | "catalog_type"
  | "catalog_id"
  | "title"
  | "media_type"
  | "release_year"
  | "synopsis"
  | "poster_path"
  | "shared_intent"
  | "manual_availability_note"
  | "created_by"
  | "created_at"
> & {
  readonly my_progress?: string | null
  /** list_watch_items only: every member's place and the together pointer (jsonb). */
  readonly places?: unknown
  readonly together?: unknown
}

export type ProgressRow = Omit<Tables<"watch_progress">, "space_id" | "watch_item_id">

export interface SessionRow extends Pick<Tables<"watch_sessions">, "id" | "watched_on" | "note"> {
  readonly watch_session_members: { user_id: string }[] | null
}

export const ITEM_COLUMNS =
  "id, space_id, catalog_type, catalog_id, title, media_type, release_year, synopsis, poster_path, shared_intent, manual_availability_note, created_by, created_at"

const DUPLICATE_MESSAGE = "Already on your list"

export const toItem = (row: WatchItemRow, myStatus?: T.ProgressStatus): T.WatchItem => ({
  id: row.id,
  spaceId: row.space_id,
  catalog:
    row.catalog_type && row.catalog_id ? { type: row.catalog_type, id: row.catalog_id } : null,
  title: row.title,
  mediaType: row.media_type,
  releaseYear: row.release_year,
  synopsis: row.synopsis,
  posterPath: row.poster_path,
  intent: row.shared_intent,
  availabilityNote: row.manual_availability_note,
  createdBy: row.created_by,
  createdAt: row.created_at,
  myStatus: myStatus ?? progressStatusOf(row.my_progress),
  places: parsePlaces(row.places),
  together: parseTogether(row.together),
})

// Postgres renders date columns as YYYY-MM-DD, which is exactly a DateOnly.
export const toProgress = (row: ProgressRow): T.Progress => ({
  userId: row.user_id,
  status: row.status,
  season: row.season,
  episode: row.episode,
  completedOn: row.completed_on as DateOnly | null,
  updatedAt: row.updated_at,
})

export const toSession = (row: SessionRow): T.WatchSession => ({
  id: row.id,
  watchedOn: row.watched_on as DateOnly,
  note: row.note,
  memberIds: (row.watch_session_members ?? []).map((member) => member.user_id),
})

/** Unique violations and the add RPC's friendly P0001 both read as a duplicate add. */
export function toWatchError(error: QueryError | null): AppError {
  if (error?.code === "23505" || error?.message === DUPLICATE_MESSAGE)
    return appError("conflict", DUPLICATE_MESSAGE)
  return toAppError(error)
}

/** Like the shared settle, but for adds: a duplicate reads as "Already on your list". */
export async function settleAdd<D, V>(
  query: PromiseLike<QueryReply<D>>,
  map: (data: D) => V,
): Promise<Result<V>> {
  const { data, error } = await query
  return error ? err(toWatchError(error)) : ok(map(data as D))
}
