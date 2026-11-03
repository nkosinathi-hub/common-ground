import type { AppError } from "@/shared/domain"
import type { SearchService } from "../application/search-service"
import { ranked, validSearch, type SearchHit } from "../domain/search"

export class SearchState {
  query = $state("")
  hits = $state<SearchHit[]>([])
  unavailable = $state<readonly string[]>([])
  loading = $state(false)
  more = $state(false)
  error = $state<AppError | null>(null)
  private page = 0
  private generation = 0
  private timer: ReturnType<typeof setTimeout> | undefined
  private abort: AbortController | undefined
  constructor(
    private readonly service: SearchService,
    private readonly spaceId: () => string,
  ) {}
  input(query: string) {
    this.cancel()
    this.query = query
    this.page = 0
    this.hits = []
    this.error = null
    this.unavailable = []
    this.more = false
    this.loading = validSearch(query)
    if (this.loading) this.timer = setTimeout(() => void this.load(), 250)
  }
  async load(more = false) {
    clearTimeout(this.timer)
    this.abort?.abort()
    this.abort = new AbortController()
    const mine = ++this.generation,
      next = more ? this.page + 1 : 0
    this.loading = true
    const result = await this.service.search(this.spaceId(), this.query, next, this.abort.signal)
    if (mine !== this.generation) return
    this.loading = false
    if (!result.ok) {
      this.error = result.error
      return
    }
    this.error = null
    this.page = next
    const hits = more ? [...this.hits, ...result.value.hits] : result.value.hits
    this.hits = ranked(
      Object.values(Object.fromEntries(hits.map((hit) => [`${hit.kind}:${hit.id}`, hit]))),
      this.query,
    )
    this.unavailable = result.value.unavailable
    this.more = result.value.more
  }
  private cancel() {
    clearTimeout(this.timer)
    this.abort?.abort()
    this.generation++
  }
  dispose() {
    this.cancel()
  }
}
