import { appError, err, ok, type Result } from "@/shared/domain"

/** Minimal keyed store the task fakes share. */
export class Store<T extends { id: string }> {
  readonly rows = new Map<string, T>()
  private n = 0

  nextId(prefix: string): string {
    this.n += 1
    return `${prefix}-${this.n}`
  }

  stamp(): string {
    return new Date(Date.UTC(2026, 9, 15, 0, 0, this.n)).toISOString()
  }

  put(row: T): Result<T> {
    this.rows.set(row.id, row)
    return ok(row)
  }

  patch(id: string, change: Partial<T>): Result<T> {
    const row = this.rows.get(id)
    return row
      ? this.put({ ...row, ...change })
      : err(appError("not_found", "That is no longer available"))
  }

  remove(id: string): Result<void> {
    return this.rows.delete(id)
      ? ok(undefined)
      : err(appError("not_found", "That is no longer available"))
  }

  where(test: (row: T) => boolean): T[] {
    return [...this.rows.values()].filter(test)
  }
}
