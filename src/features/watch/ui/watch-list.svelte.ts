import type { AppError } from "@/shared/domain"
import type { WatchService } from "../application/watch-service"
import { DEFAULT_FILTERS, hasActiveFilters } from "../domain/filters"
import type { WatchCursor, WatchFilters, WatchItem } from "../domain/types"

const LIST_SEARCH_DEBOUNCE_MS = 300

/** The shared list with filters and keyset "load more". Superseded responses are ignored. */
export class WatchListState {
  filters = $state<WatchFilters>(DEFAULT_FILTERS)
  items = $state<WatchItem[]>([])
  next = $state<WatchCursor | null>(null)
  status = $state<"loading" | "ready" | "error">("loading")
  error = $state<AppError | null>(null)
  loadingMore = $state(false)
  moreError = $state<AppError | null>(null)

  private generation = 0
  private timer: ReturnType<typeof setTimeout> | undefined

  constructor(
    private readonly service: WatchService,
    private readonly spaceId: () => string,
    private readonly delayMs = LIST_SEARCH_DEBOUNCE_MS,
  ) {}

  get narrowed(): boolean {
    return hasActiveFilters(this.filters)
  }

  get moreLabel(): string {
    if (this.loadingMore) return "Loading more"
    return this.moreError ? "Try again" : "Load more"
  }

  get empty(): boolean {
    return this.status === "ready" && this.items.length === 0
  }

  async load(): Promise<void> {
    clearTimeout(this.timer)
    const mine = ++this.generation
    this.status = "loading"
    this.loadingMore = false
    this.moreError = null
    const page = await this.service.list(this.spaceId(), this.filters)
    if (mine !== this.generation) return
    if (!page.ok) {
      this.status = "error"
      this.error = page.error
      return
    }
    this.items = [...page.value.items]
    this.next = page.value.next
    this.error = null
    this.status = "ready"
  }

  async loadMore(): Promise<void> {
    if (!this.next || this.loadingMore) return
    const mine = this.generation
    this.loadingMore = true
    this.moreError = null
    const page = await this.service.list(this.spaceId(), this.filters, this.next)
    if (mine !== this.generation) return
    this.loadingMore = false
    if (!page.ok) {
      this.moreError = page.error
      return
    }
    const known: Record<string, true> = Object.fromEntries(this.items.map((i) => [i.id, true]))
    this.items = [...this.items, ...page.value.items.filter((i) => !known[i.id])]
    this.next = page.value.next
  }

  setFilter(patch: Partial<Omit<WatchFilters, "search">>): Promise<void> {
    this.filters = { ...this.filters, ...patch }
    return this.load()
  }

  search(text: string): void {
    this.filters = { ...this.filters, search: text }
    clearTimeout(this.timer)
    this.timer = setTimeout(() => void this.load(), this.delayMs)
  }

  clearFilters(): Promise<void> {
    this.filters = { ...DEFAULT_FILTERS, sort: this.filters.sort }
    return this.load()
  }

  dispose(): void {
    clearTimeout(this.timer)
    this.generation++
  }
}
