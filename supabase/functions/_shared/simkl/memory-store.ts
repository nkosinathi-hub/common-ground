import type { Watch } from "./history.ts"
import type { SimklLink, SimklStore, SimklTokens } from "./ports.ts"

export type MemoryRow = { -readonly [K in keyof SimklLink]: SimklLink[K] } & {
  connected: boolean
  lease: boolean
  watches: Watch[]
}

/** In-memory SimklStore for tests; de-duplicates like import_simkl_watches. */
export class MemoryStore implements SimklStore {
  readonly rows = new Map<string, MemoryRow>()
  /** Called by the test fixture's sleep, so a test can act while a sync waits. */
  onWait?: () => void

  private row(userId: string): MemoryRow {
    const row = this.rows.get(userId)
    if (!row) throw new Error("no link")
    return row
  }

  async link(userId: string) {
    const row = this.rows.get(userId)
    if (!row) return null
    const { accessToken, refreshToken, accessExpiresAt, deviceCode, deviceExpiresAt, cursor } = row
    return { accessToken, refreshToken, accessExpiresAt, deviceCode, deviceExpiresAt, cursor }
  }

  async startDevice(userId: string, deviceCode: string, expiresAt: string) {
    const empty: MemoryRow = {
      ...{ accessToken: null, refreshToken: null, accessExpiresAt: null, cursor: null },
      ...{ deviceCode: null, deviceExpiresAt: null, connected: false, lease: false, watches: [] },
    }
    const row = this.rows.get(userId) ?? empty
    this.rows.set(userId, { ...row, deviceCode, deviceExpiresAt: expiresAt })
  }

  async clearDevice(userId: string) {
    Object.assign(this.row(userId), { deviceCode: null, deviceExpiresAt: null })
  }

  async saveTokens(userId: string, tokens: SimklTokens, connect: boolean) {
    const row = this.row(userId)
    Object.assign(row, tokens, { deviceCode: null, deviceExpiresAt: null, lease: false })
    if (connect) row.connected = true
  }

  async claimRefresh(userId: string) {
    const row = this.row(userId)
    if (row.lease) return false
    row.lease = true
    return true
  }

  async releaseRefresh(userId: string) {
    this.row(userId).lease = false
  }

  async importWatches(userId: string, watches: readonly Watch[], cursor: string | null) {
    const row = this.row(userId)
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
