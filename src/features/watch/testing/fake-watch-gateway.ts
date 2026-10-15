import { appError, err, ok, type AppError, type Result } from "@/shared/domain"
import type { ListRequest, WatchGateway } from "../application/ports"
import { compareFor, isAfter, matches, pageOf, sortKeyOf } from "../domain/filters"
import type * as T from "../domain/types"
import { isDuplicate } from "./fake-members"
import { ME, item as makeItem } from "./fixtures"

const DUPLICATE = appError("conflict", "Already on your list")

/** In-memory watchlist mirroring the SQL rules. Set failWith to make every call fail. */
export class FakeWatchGateway implements WatchGateway {
  items: T.WatchItem[] = []
  progressRows: T.Progress[] = []
  sessionRows: (T.WatchSession & { itemId: string })[] = []
  me = ME
  owner = false
  failWith: AppError | null = null
  readonly lists: ListRequest[] = []
  private seq = 1000

  private run<V>(value: () => Result<V>): Promise<Result<V>> {
    return Promise.resolve(this.failWith ? err(this.failWith) : value())
  }

  list(request: ListRequest) {
    this.lists.push(request)
    return this.run(() => {
      const { filters, cursor, size } = request
      const rows = this.items
        .filter((i) => i.spaceId === request.spaceId && matches(i, filters))
        .sort(compareFor(filters.sort))
        .filter((i) => !cursor || isAfter(i, cursor, filters.sort))
        .slice(0, size + 1)
      return ok(
        pageOf(
          rows.map((i) => ({ item: i, sortKey: sortKeyOf(i, filters.sort) })),
          size,
        ),
      )
    })
  }

  get(_spaceId: string, itemId: string) {
    return this.run(() => {
      const found = this.items.find((i) => i.id === itemId)
      if (!found) return err(appError("not_found", "That title is no longer on your list"))
      return ok({ item: found, canDelete: this.owner || found.createdBy === this.me })
    })
  }

  private add(spaceId: string, extra: Partial<T.WatchItem>, title: string) {
    if (isDuplicate(this.items, extra, title)) return err(DUPLICATE)
    const created = makeItem(this.seq++, title, { spaceId, ...extra })
    this.items.push(created)
    return ok(created.id)
  }

  addCatalog(spaceId: string, pick: T.CatalogPick, intent: T.SharedIntent) {
    return this.run(() => this.add(spaceId, { ...pick, intent }, pick.title))
  }
  addManual(spaceId: string, input: T.ManualTitleInput) {
    return this.run(() => this.add(spaceId, { ...input }, input.title))
  }
  private patch(itemId: string, change: Partial<T.WatchItem>) {
    this.items = this.items.map((i) => (i.id === itemId ? { ...i, ...change } : i))
    return ok(undefined)
  }
  updateDetails(itemId: string, input: T.TitleDetailsInput) {
    return this.run(() => this.patch(itemId, input))
  }
  setIntent(itemId: string, intent: T.SharedIntent) {
    return this.run(() => this.patch(itemId, { intent }))
  }
  remove(itemId: string) {
    return this.run(() => {
      this.items = this.items.filter((i) => i.id !== itemId)
      return ok(undefined)
    })
  }
  progress(_itemId: string) {
    return this.run(() => ok({ me: this.me, entries: [...this.progressRows] }))
  }
  saveProgress(itemId: string, input: T.ProgressInput) {
    return this.run(() => {
      const row = { ...input, userId: this.me, updatedAt: "2026-10-15T10:00:00Z" }
      this.progressRows = [...this.progressRows.filter((p) => p.userId !== this.me), row]
      return this.patch(itemId, { myStatus: input.status })
    })
  }
  sessions(itemId: string) {
    return this.run(() => ok(this.sessionRows.filter((s) => s.itemId === itemId)))
  }
  logSession(itemId: string, input: T.SessionInput) {
    return this.run(() => {
      const id = `session-${this.sessionRows.length + 1}`
      this.sessionRows.push({ ...input, id, itemId, note: input.note || null })
      return ok(id)
    })
  }
}
