import { detailsKey, expiryFor, isFresh, searchKey, seasonKey } from "./cache.ts"
import type { CacheEntry, CacheKind, CacheStore } from "./cache.ts"
import { detailsPath, mapDetails } from "./details.ts"
import type { Outcome } from "../http/outcome.ts"
import { failure, kindFor } from "./outcome.ts"
import { mapSearch, searchPath } from "./search.ts"
import { mapSeason, seasonPath } from "./season.ts"
import type { TmdbClient } from "./tmdb-client.ts"
import type { CatalogType, DetailsResponse, SearchResponse, SeasonResponse } from "./types.ts"

export interface CatalogService {
  search(query: string, page: number): Promise<Outcome<SearchResponse>>
  details(type: CatalogType, id: number): Promise<Outcome<DetailsResponse>>
  refresh(type: CatalogType, id: number): Promise<Outcome<DetailsResponse>>
  season(id: number, season: number): Promise<Outcome<SeasonResponse>>
}

export interface ServiceDeps {
  readonly cache: CacheStore
  readonly tmdb: TmdbClient
  readonly now?: () => Date
}

interface Lookup<T> {
  readonly key: string
  readonly kind: CacheKind
  readonly path: string
  readonly map: (body: unknown) => T
  readonly force?: boolean
}

export function createCatalogService({
  cache,
  tmdb,
  now = () => new Date(),
}: ServiceDeps): CatalogService {
  const read = (key: string) => cache.get(key).catch((): CacheEntry | null => null)
  const replay = <T>(entry: CacheEntry, stale: boolean) =>
    ({ ok: true, body: { ...(entry.response as T), checkedAt: entry.fetchedAt, stale } }) as const

  async function lookup<T extends object>(
    spec: Lookup<T>,
  ): Promise<Outcome<T & { checkedAt: string; stale: boolean }>> {
    const entry = await read(spec.key)
    if (entry && !spec.force && isFresh(entry, now())) return replay<T>(entry, false)
    if (spec.force) await cache.expire(spec.key, now()).catch(() => undefined)
    const result = await tmdb.get(spec.path)
    if (result.ok) {
      const fetchedAt = now()
      const mapped = spec.map(result.body)
      await cache
        .put({
          key: spec.key,
          response: mapped,
          fetchedAt,
          expiresAt: expiryFor(spec.kind, fetchedAt),
        })
        .catch(() => undefined)
      return { ok: true, body: { ...mapped, checkedAt: fetchedAt.toISOString(), stale: false } }
    }
    if (result.failure === "outage" && entry) return replay<T>(entry, true)
    return failure(kindFor(result.failure))
  }

  const titleLookup = (type: CatalogType, id: number, force: boolean) =>
    lookup({
      key: detailsKey(type, id),
      kind: "details",
      path: detailsPath(type, id),
      force,
      map: (b) => mapDetails(b, type),
    })

  return {
    search: (query, page) =>
      lookup({
        key: searchKey(query, page),
        kind: "search",
        path: searchPath(query, page),
        map: (b) => mapSearch(b, page),
      }),
    details: (type, id) => titleLookup(type, id, false),
    refresh: (type, id) => titleLookup(type, id, true),
    season: (id, season) =>
      lookup({
        key: seasonKey(id, season),
        kind: "season",
        path: seasonPath(id, season),
        map: mapSeason,
      }),
  }
}
