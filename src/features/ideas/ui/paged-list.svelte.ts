import type { AppError, Result } from "@/shared/domain"
import { type Cursor, type Page } from "@/shared/domain"

/** Rune store for one paged child list (newest first) with optimistic-free add and remove. */
export class PagedList<T extends { id: string }> {
  items = $state<T[]>([])
  next = $state<Cursor | null>(null)
  loading = $state(true)
  error = $state<AppError | null>(null)

  constructor(private readonly fetch: (after: Cursor | null) => Promise<Result<Page<T>>>) {}

  async load(more = false): Promise<void> {
    this.loading = true
    const result = await this.fetch(more ? this.next : null)
    this.loading = false
    if (!result.ok) return void (this.error = result.error)
    this.error = null
    this.items = more ? [...this.items, ...result.value.items] : [...result.value.items]
    this.next = result.value.next
  }

  /** Runs a write; on success applies it to the list. Returns the error for the form to show. */
  async apply<V>(write: Promise<Result<V>>, onOk: (value: V) => T[]): Promise<AppError | null> {
    const result = await write
    if (!result.ok) return result.error
    this.items = onOk(result.value)
    return null
  }

  add = (write: Promise<Result<T>>) => this.apply(write, (row) => [row, ...this.items])
  replace = (write: Promise<Result<T>>) =>
    this.apply(write, (row) => this.items.map((item) => (item.id === row.id ? row : item)))
  remove = (id: string, write: Promise<Result<void>>) =>
    this.apply(write, () => this.items.filter((item) => item.id !== id))
}
