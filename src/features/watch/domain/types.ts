export type * from "./progress-types"

export type CatalogType = "movie" | "tv"
export type MediaType = "movie" | "series" | "anime"
export type SharedIntent = "want_to_watch" | "watch_together" | "archived"
export type ProgressStatus = "not_started" | "watching" | "completed" | "dropped"
export type WatchSort = "recent" | "title"

export interface CatalogRef {
  readonly type: CatalogType
  readonly id: number
}

export interface WatchItem {
  readonly id: string
  readonly spaceId: string
  readonly catalog: CatalogRef | null
  readonly title: string
  readonly mediaType: MediaType
  readonly releaseYear: number | null
  readonly synopsis: string
  readonly posterPath: string | null
  readonly intent: SharedIntent
  readonly availabilityNote: string | null
  readonly createdBy: string | null
  readonly createdAt: string
  readonly myStatus: ProgressStatus
}

/** Item plus what the signed-in member may do with it. */
export interface WatchItemView {
  readonly item: WatchItem
  readonly canDelete: boolean
}

export interface WatchFilters {
  readonly mediaType: MediaType | null
  readonly intent: SharedIntent | null
  readonly myStatus: ProgressStatus | null
  readonly search: string
  readonly sort: WatchSort
}

/** Keyset cursor: the sort key of the last row (created_at or lower(title)) and its id. */
export interface WatchCursor {
  readonly key: string
  readonly id: string
}

export interface WatchPage {
  readonly items: readonly WatchItem[]
  readonly next: WatchCursor | null
}

export interface TitleDetailsInput {
  readonly title: string
  readonly mediaType: MediaType
  readonly releaseYear: number | null
  readonly synopsis: string
  readonly availabilityNote: string | null
}

export interface ManualTitleInput extends TitleDetailsInput {
  readonly intent: SharedIntent
}

export interface CatalogPick {
  readonly catalog: CatalogRef
  readonly title: string
  readonly mediaType: MediaType
  readonly releaseYear: number | null
  readonly synopsis: string
  readonly posterPath: string | null
}
