import { untrack } from "svelte"
import type { AppError, Result } from "@/shared/domain"

export interface PageOf<T, C> {
  readonly items: readonly T[]
  readonly next: C | null
}

export type PageLoader<T, C> = (after: C | null) => Promise<Result<PageOf<T, C>>>

/**
 * One keyset-paged list (newest first). Stale responses are ignored, loading the first page and
 * loading more are tracked apart, and writes are applied only once the server accepts them.
 */
export class PagedList<T extends { id: string }, C = unknown> {
  items = $state<T[]>([])
  next = $state<C | null>(null)
  loading = $state(true)
  loadingMore = $state(false)
  error = $state<AppError | null>(null)
  private generation = 0

  constructor(private readonly loader: PageLoader<T, C>) {}

  get hasMore(): boolean {
    return this.next !== null
  }

  /** Untracked like Resource.load: an effect that calls it depends only on what it reads first. */
  async load(): Promise<void> {
    const mine = untrack(() => {
      this.loading = true
      return ++this.generation
    })
    const result = await untrack(() => this.loader(null))
    if (mine !== this.generation) return
    this.loading = false
    this.settle(result, false)
  }

  async loadMore(): Promise<void> {
    const after = untrack(() => this.next)
    if (after === null || untrack(() => this.loadingMore)) return
    const mine = this.generation
    this.loadingMore = true
    const result = await untrack(() => this.loader(after))
    if (mine !== this.generation) return
    this.loadingMore = false
    this.settle(result, true)
  }

  /** Runs a write; on success applies it. Returns the error so the form can show it. */
  async apply<V>(
    write: Promise<Result<V>>,
    change: (value: V, items: T[]) => T[],
  ): Promise<AppError | null> {
    const result = await write
    if (!result.ok) return result.error
    this.items = change(result.value, this.items)
    return null
  }

  add = (write: Promise<Result<T>>) => this.apply(write, (row, items) => [row, ...items])
  replace = (write: Promise<Result<T>>) =>
    this.apply(write, (row, items) => items.map((item) => (item.id === row.id ? row : item)))
  remove = (id: string, write: Promise<Result<void>>) =>
    this.apply(write, (_done, items) => items.filter((item) => item.id !== id))

  private settle(result: Result<PageOf<T, C>>, appending: boolean): void {
    if (!result.ok) {
      this.error = result.error
      return
    }
    this.error = null
    this.items = appending ? [...this.items, ...result.value.items] : [...result.value.items]
    this.next = result.value.next
  }
}
