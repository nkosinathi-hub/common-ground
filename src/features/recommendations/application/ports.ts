import type { Cursor, Result } from "@/shared/domain"
import type { Recommendation, RecommendationResponse } from "../domain/recommendation"

export interface RecommendationsGateway {
  /** Creates one pending recommendation per recipient; returns their ids. */
  recommend(
    itemId: string,
    recipientIds: readonly string[],
    note: string | null,
  ): Promise<Result<string[]>>
  /** Pending recommendations addressed to the signed-in member, newest first. */
  inbox(spaceId: string, before: Cursor | null, size: number): Promise<Result<Recommendation[]>>
  respond(id: string, response: RecommendationResponse): Promise<Result<void>>
}
