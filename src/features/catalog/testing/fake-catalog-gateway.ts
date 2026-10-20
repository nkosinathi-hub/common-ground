import { appError, err, ok, type AppError, type Result } from "@/shared/domain"
import type {
  CatalogGateway,
  SearchRequest,
  SeasonRequest,
  TitleRequest,
} from "../application/ports"
import type { CatalogTitle, SearchPage, SeasonPage, TitleDetails } from "../domain/types"

export const CHECKED_AT = "2026-10-15T10:00:00.000Z"

type Call = {
  readonly method: "search" | "details" | "refresh" | "season"
  readonly request: SearchRequest | TitleRequest | SeasonRequest
}

/** In-memory catalog. Set failWith to simulate errors and hold to keep calls pending. */
export class FakeCatalogGateway implements CatalogGateway {
  titles: CatalogTitle[] = []
  readonly listings = new Map<string, TitleDetails>()
  /** Keyed "<series id>:<season>". */
  readonly seasons = new Map<string, SeasonPage>()
  readonly calls: Call[] = []
  readonly aborted: Call[] = []
  failWith: AppError | null = null
  pageSize = 20
  stale = false
  hold = false
  private waiting: (() => void)[] = []

  release(): void {
    const waiting = this.waiting
    this.waiting = []
    for (const resume of waiting) resume()
  }

  private async answer<T>(call: Call, signal: AbortSignal | undefined, value: () => Result<T>) {
    this.calls.push(call)
    if (this.hold) await new Promise<void>((resume) => this.waiting.push(resume))
    if (signal?.aborted) {
      this.aborted.push(call)
      return err(appError("network", "Cancelled"))
    }
    return this.failWith ? err(this.failWith) : value()
  }

  search(request: SearchRequest, signal?: AbortSignal): Promise<Result<SearchPage>> {
    return this.answer({ method: "search", request }, signal, () => {
      const matches = this.titles.filter((t) =>
        t.title.toLowerCase().includes(request.query.toLowerCase()),
      )
      const start = (request.page - 1) * this.pageSize
      return ok({
        results: matches.slice(start, start + this.pageSize),
        page: request.page,
        totalPages: Math.min(Math.ceil(matches.length / this.pageSize), 20),
        checkedAt: CHECKED_AT,
        stale: this.stale,
      })
    })
  }

  details(request: TitleRequest, signal?: AbortSignal): Promise<Result<TitleDetails>> {
    return this.answer({ method: "details", request }, signal, () => this.find(request))
  }

  refresh(request: TitleRequest, signal?: AbortSignal): Promise<Result<TitleDetails>> {
    return this.answer({ method: "refresh", request }, signal, () => this.find(request))
  }

  season(request: SeasonRequest, signal?: AbortSignal): Promise<Result<SeasonPage>> {
    return this.answer({ method: "season", request }, signal, () => {
      const page = this.seasons.get(`${request.id}:${request.season}`)
      return page ? ok(page) : err(appError("not_found", "Not found"))
    })
  }

  private find(request: TitleRequest): Result<TitleDetails> {
    const listing = this.listings.get(`${request.type}:${request.id}`)
    return listing ? ok({ ...listing, stale: this.stale }) : err(appError("not_found", "Not found"))
  }
}
