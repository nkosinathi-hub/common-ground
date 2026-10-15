import { appError, err, ok, type Result } from "@/shared/domain"
import type { ChildCollection } from "../application/ports"
import { nextCursor, PAGE_SIZE, type Cursor, type Page } from "@/shared/domain"

interface Child {
  readonly id: string
  readonly ideaId: string
  readonly createdAt: string
}

export class InMemoryChildren<T extends Child, Input> implements ChildCollection<T, Input> {
  readonly rows = new Map<string, T>()

  constructor(private readonly build: (base: Child, input: Input) => T) {}

  async list(ideaId: string, after: Cursor | null): Promise<Result<Page<T>>> {
    const all = [...this.rows.values()].filter((row) => row.ideaId === ideaId).reverse()
    const start = after ? all.findIndex((row) => row.id === after.id) + 1 : 0
    const items = all.slice(start, start + PAGE_SIZE)
    return ok({ items, next: nextCursor(items) })
  }

  async add(_spaceId: string, ideaId: string, input: Input): Promise<Result<T>> {
    const n = this.rows.size + 1
    const row = this.build(
      { id: `row-${n}`, ideaId, createdAt: new Date(Date.UTC(2026, 9, 15, 0, 0, n)).toISOString() },
      input,
    )
    this.rows.set(row.id, row)
    return ok(row)
  }

  async patch(id: string, change: Partial<T>): Promise<Result<T>> {
    const row = this.rows.get(id)
    if (!row) return err(appError("not_found", "Not found"))
    const next = { ...row, ...change }
    this.rows.set(id, next)
    return ok(next)
  }

  async remove(id: string): Promise<Result<void>> {
    return this.rows.delete(id) ? ok(undefined) : err(appError("not_found", "Not found"))
  }
}
