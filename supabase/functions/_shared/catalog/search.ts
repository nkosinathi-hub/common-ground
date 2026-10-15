import { mapTitle, type RawTitle } from "./map-title.ts"
import type { CatalogType, SearchPage } from "./types.ts"

export const MAX_PAGES = 20

export const searchPath = (query: string, page: number): string =>
  `search/multi?query=${encodeURIComponent(query)}&page=${page}&include_adult=false&language=en-US`

const isListable = (raw: RawTitle): raw is RawTitle & { media_type: CatalogType } =>
  Number.isSafeInteger(raw.id) && (raw.media_type === "movie" || raw.media_type === "tv")

export function mapSearch(raw: unknown, page: number): SearchPage {
  const body = (raw ?? {}) as { results?: unknown; total_pages?: unknown }
  const items = Array.isArray(body.results) ? (body.results as RawTitle[]) : []
  return {
    results: items.filter(isListable).map((item) => mapTitle(item, item.media_type)),
    page,
    totalPages: Math.min(Number(body.total_pages) || 0, MAX_PAGES),
  }
}
