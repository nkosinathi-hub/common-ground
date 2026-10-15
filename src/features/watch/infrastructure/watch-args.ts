import type { ListRequest } from "../application/ports"
import type * as T from "../domain/types"

/** Arguments of public.list_watch_items. */
export const listArgs = ({ spaceId, filters: f, cursor, size }: ListRequest) => ({
  target_space: spaceId,
  media: f.mediaType,
  intent: f.intent,
  my_status: f.myStatus,
  search: f.search || null,
  sort_by: f.sort,
  after_key: cursor?.key ?? null,
  after_id: cursor?.id ?? null,
  page_size: size,
})

/** Arguments of public.add_catalog_title. */
export const catalogArgs = (spaceId: string, pick: T.CatalogPick, intent: T.SharedIntent) => ({
  target_space: spaceId,
  kind: pick.catalog.type,
  tmdb_id: pick.catalog.id,
  title: pick.title,
  media: pick.mediaType,
  release_year: pick.releaseYear,
  synopsis: pick.synopsis,
  poster_path: pick.posterPath,
  intent,
})

/** Member-editable watch_items columns. */
export const detailColumns = (input: T.TitleDetailsInput) => ({
  title: input.title,
  media_type: input.mediaType,
  release_year: input.releaseYear,
  synopsis: input.synopsis,
  manual_availability_note: input.availabilityNote,
})
