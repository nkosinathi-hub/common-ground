import type { GenreKey } from "./genres.ts"
import type { CatalogType, TitleDetails } from "./types.ts"

/** What For you reads from a title: its canonical genres and whether it streams here. */
export interface TitleFeatures {
  readonly spaceId: string
  readonly type: CatalogType
  readonly id: number
  readonly genres: readonly GenreKey[]
  readonly streamable: boolean
}

/** Stores features for the space's copy of a title; the service role writes, members cannot. */
export type FeatureWriter = (features: TitleFeatures) => Promise<void>

const STREAMING = new Set(["flatrate", "free", "ads"])

/** Streams in South Africa: a subscription, free or with-ads listing there. Rent and buy do not count. */
export function featuresOf(
  spaceId: string,
  type: CatalogType,
  id: number,
  details: TitleDetails,
): TitleFeatures {
  const home = details.availability.fallback
    ? undefined
    : details.availability.regions.find((region) => region.code === "ZA")
  const streamable = (home?.categories ?? []).some(
    (c) => STREAMING.has(c.key) && c.providers.length > 0,
  )
  return { spaceId, type, id, genres: details.title.genres ?? [], streamable }
}
