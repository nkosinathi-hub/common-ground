import type { AppError } from "@/shared/domain"
import type { CatalogService } from "../application/catalog-service"
import { LatestRequest } from "../application/latest-request"
import type { TitleDetails, TitleRef } from "../domain/types"

/** Loads a title's availability; a failed refresh keeps the previous listing on screen. */
export class AvailabilityState {
  details = $state<TitleDetails | null>(null)
  error = $state<AppError | null>(null)
  loading = $state(false)

  private readonly latest = new LatestRequest()

  constructor(private readonly service: CatalogService) {}

  async load(spaceId: string, ref: TitleRef, refresh = false): Promise<void> {
    this.loading = true
    this.error = null
    const run = await this.latest.run((signal) =>
      refresh
        ? this.service.refresh(spaceId, ref, signal)
        : this.service.details(spaceId, ref, signal),
    )
    if (!run.current) return
    this.loading = false
    if (run.value.ok) this.details = run.value.value
    else this.error = run.value.error
  }

  cancel(): void {
    this.latest.cancel()
  }
}
