import type { AppError, Cursor } from "@/shared/domain"
import { PagedList } from "@/shared/ui"
import type { RecommendationsService } from "../application/recommendations-service"
import type { Recommendation, RecommendationResponse } from "../domain/recommendation"

/** Pending recommendations for me in one space; answered ones leave the list. */
export class InboxState {
  readonly list: PagedList<Recommendation, Cursor>

  constructor(
    private readonly service: RecommendationsService,
    spaceId: string,
  ) {
    this.list = new PagedList((after) => service.inbox(spaceId, after))
  }

  load = () => this.list.load()

  /** Returns the error when the answer was refused; the recommendation then stays. */
  respond(id: string, response: RecommendationResponse): Promise<AppError | null> {
    return this.list.remove(id, this.service.respond(id, response))
  }
}
