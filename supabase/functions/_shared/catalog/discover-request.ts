import type { GenreKey } from "./genres.ts"
import { GENRE_NAMES } from "./genres.ts"
import type { CatalogType } from "./types.ts"

/** What to find new titles from: your liked titles and genres, and what to leave out. */
export interface DiscoverRequest {
  readonly action: "discover"
  readonly spaceId: string
  readonly liked: readonly { readonly type: CatalogType; readonly id: number }[]
  readonly genres: readonly GenreKey[]
  /** "tv:1399" keys already in the space or disliked; never suggested. */
  readonly exclude: readonly string[]
}

const LIMITS = { liked: 5, genres: 3, exclude: 1000 } as const
const REF = /^(movie|tv):\d{1,10}$/

const isRef = (v: unknown): v is { type: CatalogType; id: number } => {
  const r = v as { type?: unknown; id?: unknown } | null
  return (
    (r?.type === "movie" || r?.type === "tv") && Number.isSafeInteger(r.id) && (r.id as number) > 0
  )
}

/** Lists past their limits are refused, not trimmed, so a client bug shows up. */
export function parseDiscover(
  body: Record<string, unknown>,
  spaceId: string,
): { ok: true; value: DiscoverRequest } | { ok: false; message: string } {
  const liked = Array.isArray(body.liked) ? body.liked : []
  const genres = Array.isArray(body.genres) ? body.genres : []
  const exclude = Array.isArray(body.exclude) ? body.exclude : []
  if (liked.length > LIMITS.liked || !liked.every(isRef))
    return { ok: false, message: `Choose up to ${LIMITS.liked} liked titles` }
  if (
    genres.length > LIMITS.genres ||
    !genres.every((g) => typeof g === "string" && g in GENRE_NAMES)
  )
    return { ok: false, message: `Choose up to ${LIMITS.genres} known genres` }
  if (
    exclude.length > LIMITS.exclude ||
    !exclude.every((k) => typeof k === "string" && REF.test(k))
  )
    return { ok: false, message: "Leave out titles as type:id" }
  return {
    ok: true,
    value: {
      action: "discover",
      spaceId,
      liked,
      genres: genres as GenreKey[],
      exclude: exclude as string[],
    },
  }
}
