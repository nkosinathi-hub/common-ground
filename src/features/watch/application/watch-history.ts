import { appError, err, type Result } from "@/shared/domain"
import type { EpisodeTick, HistorySource, WatchHistoryGateway } from "./ports"

const whole = (n: number, min: number) => Number.isInteger(n) && n >= min

/** Records what someone watched; the database keeps their place moving forward only. */
export class WatchHistory {
  constructor(private readonly gateway: WatchHistoryGateway) {}

  markWatched(
    itemId: string,
    tick: EpisodeTick | null,
    source: HistorySource,
  ): Promise<Result<void>> {
    if (tick && !(whole(tick.season, 0) && whole(tick.episode, 1)))
      return Promise.resolve(err(appError("validation", "Choose a real season and episode")))
    return this.gateway.markWatched(itemId, tick, source)
  }

  statuses = (itemId: string) => this.gateway.statuses(itemId)
}
