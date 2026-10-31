import type { ListRequest } from "../application/ports"
import type * as T from "../domain/types"

/**
 * Generated RPC argument types drop SQL nullability, yet these parameters take null (a manual
 * or unknown value). Only for parameters without a default, where omitting is not an option.
 */
const sqlNull = <V>(value: V | null): V => value as V

/** Arguments of public.list_watch_items. Omitted filters fall back to the SQL default, null. */
export const listArgs = ({ spaceId, filters, cursor, size }: ListRequest) => ({
  target_space: spaceId,
  media: filters.mediaType ?? undefined,
  intent: filters.intent ?? undefined,
  my_status: filters.myStatus ?? undefined,
  search: filters.search || undefined,
  sort_by: filters.sort,
  after_key: cursor?.key,
  after_id: cursor?.id,
  page_size: size,
})

/** Arguments of public.add_catalog_title. */
export const catalogArgs = (spaceId: string, pick: T.CatalogPick, intent: T.SharedIntent) => ({
  target_space: spaceId,
  kind: pick.catalog.type,
  tmdb_id: pick.catalog.id,
  title: pick.title,
  media: pick.mediaType,
  release_year: sqlNull(pick.releaseYear),
  synopsis: pick.synopsis,
  poster_path: sqlNull(pick.posterPath),
  intent,
})

/** Arguments of public.save_watch_progress. */
export const progressArgs = (itemId: string, input: T.ProgressInput) => ({
  item: itemId,
  new_status: input.status,
  new_season: sqlNull(input.season),
  new_episode: sqlNull(input.episode),
  new_completed_on: sqlNull<string>(input.completedOn),
})

/** Member-editable watch_items columns. */
export const detailColumns = (input: T.TitleDetailsInput) => ({
  title: input.title,
  media_type: input.mediaType,
  release_year: input.releaseYear,
  synopsis: input.synopsis,
  manual_availability_note: input.availabilityNote,
})
