import type { AppError } from "@/shared/domain"
import type { CatalogService } from "../application/catalog-service"
import { LatestRequest } from "../application/latest-request"
import { validateQuery } from "../domain/rules"
import type { SearchPage } from "../domain/types"

export const SEARCH_DEBOUNCE_MS = 300

/** Debounced, cancellable catalog search. The query is never cleared by a failure. */
export class SearchState {
  query = $state("")
  page = $state(1)
  loading = $state(false)
  result = $state<SearchPage | null>(null)
  error = $state<AppError | null>(null)

  private timer: ReturnType<typeof setTimeout> | undefined
  private readonly latest = new LatestRequest()

  constructor(
    private readonly service: CatalogService,
    private readonly spaceId: () => string,
    private readonly delayMs = SEARCH_DEBOUNCE_MS,
  ) {}

  input(value: string): void {
    this.query = value
    this.page = 1
    clearTimeout(this.timer)
    this.latest.cancel()
    this.error = null
    if (!validateQuery(value).ok) {
      this.loading = false
      this.result = null
      return
    }
    this.loading = true
    this.timer = setTimeout(() => void this.load(), this.delayMs)
  }

  goTo(page: number): void {
    this.page = page
    void this.load()
  }

  retry(): void {
    void this.load()
  }

  dispose(): void {
    clearTimeout(this.timer)
    this.latest.cancel()
  }

  private async load(): Promise<void> {
    clearTimeout(this.timer)
    this.loading = true
    this.error = null
    const { query, page } = this
    const run = await this.latest.run((signal) =>
      this.service.search(this.spaceId(), query, page, signal),
    )
    if (!run.current) return
    this.loading = false
    if (run.value.ok) {
      this.result = run.value.value
    } else {
      this.result = null
      this.error = run.value.error
    }
  }
}
