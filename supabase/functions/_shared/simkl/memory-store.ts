import type { Watch } from "./history.ts"
import type { SimklStore } from "./ports.ts"

interface Row {
  token: string
  cursor: string | null
  watches: Watch[]
}

/** In-memory SimklStore for tests; de-duplicates like import_simkl_watches. */
export class MemoryStore implements SimklStore {
  readonly rows = new Map<string, Row>()

  async link(userId: string) {
    const row = this.rows.get(userId)
    return row ? { token: row.token, cursor: row.cursor } : null
  }

  async save(userId: string, token: string) {
    this.rows.set(userId, { token, cursor: null, watches: [] })
  }

  async importWatches(userId: string, watches: readonly Watch[], cursor: string | null) {
    const row = this.rows.get(userId)
    if (!row) throw new Error("no link")
    const key = (w: Watch) => JSON.stringify(w)
    const known = new Set(row.watches.map(key))
    const fresh = watches.filter((w) => !known.has(key(w)))
    row.watches.push(...fresh)
    row.cursor = cursor ?? row.cursor
    return fresh.length
  }

  async remove(userId: string) {
    this.rows.delete(userId)
  }
}
