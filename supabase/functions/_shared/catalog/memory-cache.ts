import type { CacheEntry, CacheStore, CacheWrite } from "./cache.ts"

/** In-memory CacheStore for tests and local experiments. */
export class MemoryCache implements CacheStore {
  readonly entries = new Map<string, CacheEntry>()

  async get(key: string) {
    return this.entries.get(key) ?? null
  }

  async put({ key, response, fetchedAt, expiresAt }: CacheWrite) {
    this.entries.set(key, {
      response,
      fetchedAt: fetchedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })
  }

  async expire(key: string, at: Date) {
    const entry = this.entries.get(key)
    if (entry) this.entries.set(key, { ...entry, expiresAt: at.toISOString() })
  }
}
