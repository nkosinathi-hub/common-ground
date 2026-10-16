import type { Cursor, Page, Result } from "@/shared/domain"
import type { Recommendation, RecommendationResponse } from "../domain/recommendation"

/** One pending recommendation per recipient, with the same optional note. */
export interface RecommendRequest {
  readonly itemId: string
  readonly recipientIds: readonly string[]
  readonly note: string | null
}

/** Pending recommendations addressed to the signed-in member, newest first after `after`. */
export interface InboxPageRequest {
  readonly spaceId: string
  readonly after: Cursor | null
}

export interface RecommendationsGateway {
  /** Returns the ids of the recommendations created. */
  recommend(request: RecommendRequest): Promise<Result<string[]>>
  inbox(request: InboxPageRequest): Promise<Result<Page<Recommendation>>>
  respond(id: string, response: RecommendationResponse): Promise<Result<void>>
}
