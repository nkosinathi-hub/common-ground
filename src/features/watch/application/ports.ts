import type { Result } from "@/shared/domain"
import type { EpisodeStatus } from "../domain/episodes"
import type { Opinion } from "../domain/progress-types"
import type {
  CatalogPick,
  ManualTitleInput,
  MemberProgress,
  ProgressInput,
  SessionInput,
  SharedIntent,
  TitleDetailsInput,
  WatchCursor,
  WatchFilters,
  WatchItemView,
  WatchPage,
  WatchSession,
  MediaType,
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
  /** How many titles of each type the library holds, archived ones left out. */
  countByType(spaceId: string): Promise<Result<Record<MediaType, number>>>
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

/** One episode someone watched, or null for a film. */
export interface EpisodeTick {
  readonly season: number
  readonly episode: number
}

/** Who recorded it: the in-app player, or a tick by hand. Parties write their own history. */
export type HistorySource = "player" | "manual"

/** Episode history: moves the person's own place forward (episode_watches_advance). */
export interface WatchHistoryGateway {
  markWatched(
    itemId: string,
    tick: EpisodeTick | null,
    source: HistorySource,
  ): Promise<Result<void>>
  /** Each watched episode of a title, for the Episodes tab (episode_statuses). */
  statuses(itemId: string): Promise<Result<EpisodeStatus[]>>
}

/** Like / dislike, private to the signed-in person. Null clears it. */
export interface WatchOpinionGateway {
  opinion(itemId: string): Promise<Result<Opinion | null>>
  setOpinion(spaceId: string, itemId: string, opinion: Opinion | null): Promise<Result<void>>
}
