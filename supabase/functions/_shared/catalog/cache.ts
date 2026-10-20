import type { CatalogType } from "./types.ts"

export const SEARCH_TTL_MS = 15 * 60 * 1000
export const DETAILS_TTL_MS = 24 * 60 * 60 * 1000

export type CacheKind = "search" | "details" | "season"

/** One row of public.catalog_cache, expired rows included (they back stale-on-outage). */
export interface CacheEntry {
  readonly response: unknown
  readonly fetchedAt: string
  readonly expiresAt: string
}

/** A fresh TMDB answer to keep until it expires. */
export interface CacheWrite {
  readonly key: string
  readonly response: unknown
  readonly fetchedAt: Date
  readonly expiresAt: Date
}

/** Storage port for the cache; the Edge Function implements it with the service-role client. */
export interface CacheStore {
  get(key: string): Promise<CacheEntry | null>
  put(write: CacheWrite): Promise<void>
  expire(key: string, at: Date): Promise<void>
}

export const searchKey = (query: string, page: number): string =>
  `search:${query.trim().replace(/\s+/g, " ").toLowerCase()}:${page}`

export const detailsKey = (type: CatalogType, id: number): string => `details:${type}:${id}`
export const seasonKey = (id: number, season: number): string => `season:tv:${id}:${season}`

export const expiryFor = (kind: CacheKind, now: Date): Date =>
  new Date(now.getTime() + (kind === "search" ? SEARCH_TTL_MS : DETAILS_TTL_MS))

export function isFresh(entry: Pick<CacheEntry, "expiresAt">, now: Date): boolean {
  const expires = Date.parse(entry.expiresAt)
  return Number.isFinite(expires) && expires > now.getTime()
}
