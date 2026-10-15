import type { AppError } from "@/shared/domain"
import type { WatchService } from "../application/watch-service"
import type { RandomSource } from "../domain/pick"
import type { WatchItem } from "../domain/types"

/** "Pick for us": a random title from the watch-together queue, with retry. */
export class PickState {
  open = $state(false)
  loading = $state(false)
  pick = $state<WatchItem | null>(null)
  error = $state<AppError | null>(null)
  /** True once a load finished and the queue had nothing in it. */
  emptyQueue = $state(false)

  constructor(
    private readonly service: WatchService,
    private readonly spaceId: () => string,
    private readonly random?: RandomSource,
  ) {}

  start(): Promise<void> {
    this.open = true
    this.pick = null
    return this.roll()
  }

  again(): Promise<void> {
    return this.roll(this.pick?.id)
  }

  private async roll(previousId?: string): Promise<void> {
    this.loading = true
    this.error = null
    const result = await this.service.pickForUs(this.spaceId(), this.random, previousId)
    this.loading = false
    if (!result.ok) {
      this.error = result.error
      return
    }
    this.pick = result.value
    this.emptyQueue = result.value === null
  }
}
