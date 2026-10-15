import { ok, type AppError, type Cursor, type Result } from "@/shared/domain"
import type { RecommendationsService } from "../application/recommendations-service"
import type { Recommendation, RecommendationResponse } from "../domain/recommendation"

/** Pending recommendations for me in one space; answered ones leave the list. */
export class InboxState {
  items = $state<Recommendation[]>([])
  status = $state<"loading" | "ready" | "error">("loading")
  error = $state<AppError | null>(null)
  next = $state<Cursor | null>(null)
  loadingMore = $state(false)

  constructor(
    private readonly service: RecommendationsService,
    private readonly spaceId: string,
  ) {}

  get hasMore(): boolean {
    return this.next !== null
  }

  async load(): Promise<void> {
    this.status = "loading"
    const page = await this.service.inbox(this.spaceId, null)
    if (!page.ok) {
      this.error = page.error
      this.status = "error"
      return
    }
    this.items = [...page.value.items]
    this.next = page.value.next
    this.error = null
    this.status = "ready"
  }

  retry = () => this.load()

  async loadMore(): Promise<Result<void>> {
    if (!this.next) return ok(undefined)
    this.loadingMore = true
    const page = await this.service.inbox(this.spaceId, this.next)
    this.loadingMore = false
    if (!page.ok) return page
    this.items = [...this.items, ...page.value.items]
    this.next = page.value.next
    return ok(undefined)
  }

  async respond(id: string, response: RecommendationResponse): Promise<Result<void>> {
    const answered = await this.service.respond(id, response)
    if (answered.ok) this.items = this.items.filter((r) => r.id !== id)
    return answered
  }
}
