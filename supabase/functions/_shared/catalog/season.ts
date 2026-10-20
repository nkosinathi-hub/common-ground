import type { Episode, SeasonDetails } from "./types.ts"

type Raw = Record<string, unknown>

export const seasonPath = (id: number, season: number): string =>
  `tv/${id}/season/${season}?language=en-US`

const minutes = (value: unknown): number | null =>
  typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null

/** One season's episodes in order, for the item page and for mapping a playback episode. */
export function mapSeason(raw: unknown): SeasonDetails {
  const body = (raw ?? {}) as Raw
  const episodes: Episode[] = (Array.isArray(body.episodes) ? (body.episodes as Raw[]) : [])
    .filter((e) => Number.isInteger(e?.episode_number) && (e.episode_number as number) > 0)
    .map((e) => ({
      number: e.episode_number as number,
      name:
        typeof e.name === "string" ? e.name.slice(0, 200) : `Episode ${String(e.episode_number)}`,
      airDate:
        typeof e.air_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.air_date)
          ? e.air_date
          : null,
      runtimeMinutes: minutes(e.runtime),
    }))
    .sort((a, b) => a.number - b.number)
  return {
    number: Number.isInteger(body.season_number) ? (body.season_number as number) : 0,
    episodes,
  }
}
