import { catalogKey, type CatalogTitle, type PickStatus } from "@/features/catalog"
import type { Result } from "@/shared/domain"
import type { WatchService } from "../application/watch-service"
import { fromCatalog } from "../domain/catalog"
import type { SharedIntent, TitleDetailsInput } from "../domain/types"

export interface AddedTitle {
  readonly id: string
  readonly title: string
}

/**
 * What the add dialog has added this time it was open. A catalog result keeps its place in the
 * search and turns to "added", so people can go on adding from the same results.
 */
export class AddTitleState {
  added = $state<AddedTitle[]>([])
  private picked = $state<Record<string, PickStatus>>({})
  private busy = false

  constructor(
    private readonly service: WatchService,
    private readonly spaceId: () => string,
    private readonly intent: () => SharedIntent,
  ) {}

  statusOf(title: CatalogTitle): PickStatus {
    return this.picked[catalogKey(title)] ?? "idle"
  }

  /** Null when the title is already added or another add is still running. */
  async pick(title: CatalogTitle): Promise<Result<string> | null> {
    const key = catalogKey(title)
    if (this.busy || this.picked[key]) return null
    this.busy = true
    this.picked[key] = "adding"
    const result = await this.service.addCatalog(this.spaceId(), fromCatalog(title), this.intent())
    // Already on the list counts as added: the tick is true either way.
    if (result.ok || result.error.kind === "conflict") this.picked[key] = "added"
    else delete this.picked[key]
    this.record(title.title, result)
    this.busy = false
    return result
  }

  async addManual(input: TitleDetailsInput): Promise<Result<string>> {
    const result = await this.service.addManual(this.spaceId(), { ...input, intent: this.intent() })
    this.record(input.title.trim(), result)
    return result
  }

  reset(): void {
    this.added = []
    this.picked = {}
  }

  private record(title: string, result: Result<string>): void {
    if (result.ok) this.added = [...this.added, { id: result.value, title }]
  }
}
