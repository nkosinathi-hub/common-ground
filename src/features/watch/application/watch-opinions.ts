import type { Opinion } from "../domain/progress-types"
import type { WatchOpinionGateway } from "./ports"

/** Like / dislike on a title: one tap sets it, the same tap again clears it. */
export class WatchOpinions {
  constructor(private readonly gateway: WatchOpinionGateway) {}

  opinion = (itemId: string) => this.gateway.opinion(itemId)

  toggle(spaceId: string, itemId: string, current: Opinion | null, chosen: Opinion) {
    return this.gateway.setOpinion(spaceId, itemId, current === chosen ? null : chosen)
  }
}
