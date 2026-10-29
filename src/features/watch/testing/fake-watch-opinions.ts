import { ok } from "@/shared/domain"
import type { WatchOpinionGateway } from "../application/ports"
import type { Opinion } from "../domain/progress-types"

/** The signed-in person's opinions, by title. */
export class FakeWatchOpinions implements WatchOpinionGateway {
  readonly rows = new Map<string, Opinion>()

  opinion = async (itemId: string) => ok(this.rows.get(itemId) ?? null)

  async setOpinion(_spaceId: string, itemId: string, opinion: Opinion | null) {
    if (opinion === null) this.rows.delete(itemId)
    else this.rows.set(itemId, opinion)
    return ok(undefined)
  }
}
