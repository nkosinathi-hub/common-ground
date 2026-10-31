import type { Outcome } from "../http/outcome.ts"
import type { DiscoverRequest } from "./discover-request.ts"
import { GENRE_NAMES, type GenreKey } from "./genres.ts"
import { discoverPath, mapDiscover } from "./discover-tmdb.ts"
import type { CatalogTitle, CatalogType, TitleDetails } from "./types.ts"

/** A suggested new title and what it came from: "Because you liked Severance". */
export type Discovered = CatalogTitle & { readonly because: string }
export interface DiscoverResponse {
  readonly results: Discovered[]
}

const MAX_RESULTS = 20

interface Source {
  readonly because: string
  readonly titles: readonly CatalogTitle[]
}

/**
 * Merges what each liked title and genre suggests: a title named by more sources ranks higher,
 * liked titles' own recommendations before genre lists, and nothing excluded or repeated.
 */
export function mergeSources(
  sources: readonly Source[],
  exclude: ReadonlySet<string>,
): Discovered[] {
  const found = new Map<string, { title: Discovered; votes: number; first: number }>()
  sources.forEach((source, order) =>
    source.titles.forEach((title) => {
      const key = `${title.type}:${title.id}`
      if (exclude.has(key)) return
      const seen = found.get(key)
      if (seen) seen.votes += 1
      else found.set(key, { title: { ...title, because: source.because }, votes: 1, first: order })
    }),
  )
  return [...found.values()]
    .sort((a, b) => b.votes - a.votes || a.first - b.first)
    .slice(0, MAX_RESULTS)
    .map((f) => f.title)
}

export interface DiscoverLookups {
  readonly details: (type: CatalogType, id: number) => Promise<Outcome<TitleDetails>>
  readonly genre: (type: CatalogType, genre: GenreKey) => Promise<Outcome<CatalogTitle[]>>
}

/** Every lookup goes through the catalog cache; one that fails only drops its own source. */
export async function discoverTitles(
  request: DiscoverRequest,
  lookups: DiscoverLookups,
): Promise<Outcome<DiscoverResponse>> {
  const fromLiked = request.liked.map(async ({ type, id }) => {
    const details = await lookups.details(type, id)
    return details.ok
      ? [{ because: details.body.title.title, titles: details.body.recommendations }]
      : []
  })
  const fromGenres = request.genres.flatMap((genre) =>
    (["movie", "tv"] as const).map(async (type) => {
      const list = await lookups.genre(type, genre)
      return list.ok ? [{ because: GENRE_NAMES[genre], titles: list.body }] : []
    }),
  )
  const sources = (await Promise.all([...fromLiked, ...fromGenres])).flat()
  return { ok: true, body: { results: mergeSources(sources, new Set(request.exclude)) } }
}

type ListLookup = <T extends object>(
  key: string,
  path: string,
  map: (body: unknown) => T,
) => Promise<Outcome<T>>

/** Genre lists are cached like searches; titles come from the details cache. */
export const discoverLookups = (
  details: DiscoverLookups["details"],
  list: ListLookup,
): DiscoverLookups => ({
  details,
  genre: async (type, genre) => {
    const found = await list(`discover:${type}:${genre}`, discoverPath(type, genre), (b) => ({
      results: mapDiscover(b, type),
    }))
    return found.ok ? { ok: true, body: found.body.results } : found
  },
})
