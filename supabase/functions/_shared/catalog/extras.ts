import { mapTitle, type RawTitle } from "./map-title.ts"
import type { CatalogTitle, CatalogType, NextEpisode, Season } from "./types.ts"

const YOUTUBE_KEY = /^[A-Za-z0-9_-]{11}$/
const MAX_RECOMMENDATIONS = 12

type Raw = Record<string, unknown>
const list = (value: unknown): Raw[] =>
  Array.isArray(value) ? value.filter((v): v is Raw => typeof v === "object" && v !== null) : []
const count = (value: unknown): number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0
const date = (value: unknown): string | null =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null

/** TMDB's official YouTube trailer key (embedded as youtube-nocookie), else any YouTube trailer. */
export function mapTrailer(videos: unknown): string | null {
  const trailers = list((videos as Raw | undefined)?.results).filter(
    (v) => v.site === "YouTube" && v.type === "Trailer" && YOUTUBE_KEY.test(String(v.key)),
  )
  const chosen = trailers.find((v) => v.official === true) ?? trailers[0]
  return chosen ? String(chosen.key) : null
}

/** "More like this": TMDB recommendations of the same type, broken entries skipped. */
export function mapRecommendations(recs: unknown, type: CatalogType): CatalogTitle[] {
  return list((recs as Raw | undefined)?.results)
    .filter((r) => Number.isSafeInteger(r.id) && (r.id as number) > 0)
    .slice(0, MAX_RECOMMENDATIONS)
    .map((r) => mapTitle(r as RawTitle, type))
}

/** A series' seasons in order; season 0 holds the specials. */
export function mapSeasons(raw: unknown): Season[] {
  return list((raw as Raw).seasons)
    .filter((s) => Number.isInteger(s.season_number) && (s.season_number as number) >= 0)
    .map((s) => ({
      number: s.season_number as number,
      name: typeof s.name === "string" ? s.name.slice(0, 120) : `Season ${String(s.season_number)}`,
      episodeCount: count(s.episode_count),
      airDate: date(s.air_date),
    }))
    .sort((a, b) => a.number - b.number)
}

export function mapNextEpisode(raw: unknown): NextEpisode | null {
  const next = (raw as Raw).next_episode_to_air as Raw | null | undefined
  if (!next || !Number.isInteger(next.season_number) || !Number.isInteger(next.episode_number))
    return null
  return {
    season: next.season_number as number,
    episode: next.episode_number as number,
    airDate: date(next.air_date),
  }
}
