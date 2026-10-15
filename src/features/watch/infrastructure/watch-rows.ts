import { appError, err, ok, type AppError, type DateOnly, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import type * as T from "../domain/types"

export interface WatchItemRow {
  id: string
  space_id: string
  catalog_type: T.CatalogType | null
  catalog_id: number | null
  title: string
  media_type: T.MediaType
  release_year: number | null
  synopsis: string
  poster_path: string | null
  shared_intent: T.SharedIntent
  manual_availability_note: string | null
  created_by: string | null
  created_at: string
  my_progress?: T.ProgressStatus
  sort_key?: string
}

export interface ProgressRow {
  user_id: string
  status: T.ProgressStatus
  season: number | null
  episode: number | null
  rating: number | null
  completed_on: string | null
  updated_at: string
}

export interface SessionRow {
  id: string
  watched_on: string
  note: string | null
  watch_session_members: { user_id: string }[] | null
}

export const ITEM_COLUMNS =
  "id, space_id, catalog_type, catalog_id, title, media_type, release_year, synopsis, " +
  "poster_path, shared_intent, manual_availability_note, created_by, created_at"

export const toItem = (r: WatchItemRow, myStatus?: T.ProgressStatus): T.WatchItem => ({
  id: r.id,
  spaceId: r.space_id,
  catalog: r.catalog_type && r.catalog_id ? { type: r.catalog_type, id: r.catalog_id } : null,
  title: r.title,
  mediaType: r.media_type,
  releaseYear: r.release_year,
  synopsis: r.synopsis,
  posterPath: r.poster_path,
  intent: r.shared_intent,
  availabilityNote: r.manual_availability_note,
  createdBy: r.created_by,
  createdAt: r.created_at,
  myStatus: myStatus ?? r.my_progress ?? "not_started",
})

export const toProgress = (r: ProgressRow): T.Progress => ({
  userId: r.user_id,
  status: r.status,
  season: r.season,
  episode: r.episode,
  rating: r.rating,
  completedOn: r.completed_on as DateOnly | null,
  updatedAt: r.updated_at,
})

export const toSession = (r: SessionRow): T.WatchSession => ({
  id: r.id,
  watchedOn: r.watched_on as DateOnly,
  note: r.note,
  memberIds: (r.watch_session_members ?? []).map((m) => m.user_id),
})

type PgError = { code?: string; message?: string } | null

export const DUPLICATE_MESSAGE = "Already on your list"

/** Unique violations and the add RPC's friendly P0001 both read as a duplicate add. */
export function toWatchError(error: PgError): AppError {
  if (error?.code === "23505" || error?.message === DUPLICATE_MESSAGE)
    return appError("conflict", DUPLICATE_MESSAGE)
  return toAppError(error)
}

export const unwrap = <V>(reply: { data: unknown; error: PgError }): Result<V> =>
  reply.error ? err(toWatchError(reply.error)) : ok(reply.data as V)

export const unit = (reply: { error: PgError }): Result<void> =>
  reply.error ? err(toWatchError(reply.error)) : ok(undefined)
