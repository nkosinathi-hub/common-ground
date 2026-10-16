import { ok, PAGE_SIZE, todayDateOnly, type DateOnly, type Result } from "@/shared/domain"
import { normaliseSearch } from "../domain/filters"
import { pickForUs, type RandomSource } from "../domain/pick"
import type {
  CatalogPick,
  ManualTitleInput,
  ProgressInput,
  SessionInput,
  SharedIntent,
  TitleDetailsInput,
  WatchCursor,
  WatchFilters,
  WatchItem,
  WatchPage,
} from "../domain/types"
import { validateDetails, validateProgress, validateSession } from "../domain/validation"
import type { WatchGateway } from "./ports"

/** Upper bound on pages read to build the pick-for-us queue: 50 pages of the page size. */
const QUEUE_PAGE_LIMIT = 50

export class WatchService {
  constructor(
    private readonly gateway: WatchGateway,
    private readonly today: () => DateOnly = () => todayDateOnly(),
    private readonly pageSize = PAGE_SIZE,
  ) {}

  list(spaceId: string, filters: WatchFilters, cursor: WatchCursor | null = null) {
    const clean = { ...filters, search: normaliseSearch(filters.search) }
    return this.gateway.list({ spaceId, filters: clean, cursor, size: this.pageSize })
  }

  get = (spaceId: string, itemId: string) => this.gateway.get(spaceId, itemId)
  addCatalog = (spaceId: string, pick: CatalogPick, intent: SharedIntent) =>
    this.gateway.addCatalog(spaceId, pick, intent)
  setIntent = (itemId: string, intent: SharedIntent) => this.gateway.setIntent(itemId, intent)
  remove = (itemId: string) => this.gateway.remove(itemId)
  progress = (itemId: string) => this.gateway.progress(itemId)
  sessions = (itemId: string) => this.gateway.sessions(itemId)

  async addManual(spaceId: string, input: ManualTitleInput): Promise<Result<string>> {
    const valid = validateDetails(input)
    return valid.ok
      ? this.gateway.addManual(spaceId, { ...valid.value, intent: input.intent })
      : valid
  }

  async updateDetails(itemId: string, input: TitleDetailsInput): Promise<Result<void>> {
    const valid = validateDetails(input)
    return valid.ok ? this.gateway.updateDetails(itemId, valid.value) : valid
  }

  async saveProgress(itemId: string, input: ProgressInput): Promise<Result<void>> {
    const valid = validateProgress(input)
    return valid.ok ? this.gateway.saveProgress(itemId, valid.value) : valid
  }

  async logSession(itemId: string, input: SessionInput): Promise<Result<string>> {
    const valid = validateSession(input, this.today())
    return valid.ok ? this.gateway.logSession(itemId, valid.value) : valid
  }

  /** Every watch-together title, read page by page. */
  async togetherQueue(spaceId: string): Promise<Result<WatchItem[]>> {
    const filters: WatchFilters = {
      mediaType: null,
      intent: "watch_together",
      myStatus: null,
      search: "",
      sort: "recent",
    }
    const items: WatchItem[] = []
    let cursor: WatchCursor | null = null
    for (let page = 0; page < QUEUE_PAGE_LIMIT; page++) {
      const result: Result<WatchPage> = await this.list(spaceId, filters, cursor)
      if (!result.ok) return result
      items.push(...result.value.items)
      cursor = result.value.next
      if (!cursor) break
    }
    return ok(items)
  }

  /** Random pick from the watch-together queue; null when the queue is empty. */
  async pickForUs(
    spaceId: string,
    random?: RandomSource,
    previousId?: string,
  ): Promise<Result<WatchItem | null>> {
    const queue = await this.togetherQueue(spaceId)
    return queue.ok ? ok(pickForUs(queue.value, random, previousId)) : queue
  }
}
