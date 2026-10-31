import { GENRE_NAMES } from "../../../../supabase/functions/_shared/catalog/genres.ts"
import { appError, err, ok, type Result } from "@/shared/domain"
import type { Availability, CatalogTitle, MediaKind, Region } from "./types"

export type PosterSize = "w92" | "w185" | "w342"

export interface SplitAvailability {
  readonly home: Region | null
  readonly others: readonly Region[]
  readonly fallback: boolean
}

const HOME_REGION = "ZA"
const QUERY_MIN = 2
export const QUERY_MAX = 160
const PAGE_MAX = 20

const POSTER_PATH = /^\/[A-Za-z0-9_-][A-Za-z0-9_.-]*$/

export function posterUrl(path: string | null, size: PosterSize = "w185"): string | null {
  return path && POSTER_PATH.test(path) ? `https://image.tmdb.org/t/p/${size}${path}` : null
}

export function splitAvailability(availability: Availability): SplitAvailability {
  const home = availability.regions.find((region) => region.code === HOME_REGION) ?? null
  const others = availability.regions.filter((region) => region.code !== HOME_REGION)
  return { home, others, fallback: home === null }
}

export function validateQuery(input: string): Result<string> {
  const query = input.trim()
  return query.length >= QUERY_MIN && query.length <= QUERY_MAX
    ? ok(query)
    : err(appError("validation", `Search with ${QUERY_MIN} to ${QUERY_MAX} characters`, "query"))
}

export function validatePage(page: number): Result<number> {
  return Number.isInteger(page) && page >= 1 && page <= PAGE_MAX
    ? ok(page)
    : err(appError("validation", `Choose a page from 1 to ${PAGE_MAX}`, "page"))
}

const LABELS: Record<MediaKind, string> = { movie: "Movie", series: "Series", anime: "Anime" }

export const mediaKindLabel = (kind: MediaKind): string => LABELS[kind]

/** A title's identity across searches: TMDB ids are only unique within movies or within TV. */
export const catalogKey = (title: Pick<CatalogTitle, "type" | "id">): string =>
  `${title.type}-${title.id}`

/** Where a search result stands in the caller's flow: not added yet, being added, or added. */
export type PickStatus = "idle" | "adding" | "added"

/** "Drama" for a canonical genre key; an unknown key reads as itself. */
export const genreName = (key: string): string =>
  (GENRE_NAMES as Record<string, string>)[key] ?? key
