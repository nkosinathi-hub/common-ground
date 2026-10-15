import type { Result } from "@/shared/domain"
import type {
  CatalogPick,
  ManualTitleInput,
  MemberProgress,
  ProgressInput,
  SessionInput,
  SharedIntent,
  SpaceMember,
  TitleDetailsInput,
  WatchCursor,
  WatchFilters,
  WatchItemView,
  WatchPage,
  WatchSession,
} from "../domain/types"

export interface ListRequest {
  readonly spaceId: string
  readonly filters: WatchFilters
  readonly cursor: WatchCursor | null
  readonly size: number
}

/** Watchlist persistence. Duplicate adds fail with kind "conflict" and copy "Already on your list". */
export interface WatchGateway {
  list(request: ListRequest): Promise<Result<WatchPage>>
  get(spaceId: string, itemId: string): Promise<Result<WatchItemView>>
  addCatalog(spaceId: string, pick: CatalogPick, intent: SharedIntent): Promise<Result<string>>
  addManual(spaceId: string, input: ManualTitleInput): Promise<Result<string>>
  updateDetails(itemId: string, input: TitleDetailsInput): Promise<Result<void>>
  setIntent(itemId: string, intent: SharedIntent): Promise<Result<void>>
  remove(itemId: string): Promise<Result<void>>
  progress(itemId: string): Promise<Result<MemberProgress>>
  saveProgress(itemId: string, input: ProgressInput): Promise<Result<void>>
  sessions(itemId: string): Promise<Result<WatchSession[]>>
  logSession(itemId: string, input: SessionInput): Promise<Result<string>>
}

/** Current members of a space, for "who was there" and progress names. Wired by the app. */
export interface MemberDirectory {
  members(spaceId: string): Promise<Result<SpaceMember[]>>
}
