import type { Opinion } from "./progress-types"

/** What For you reads from a title: canonical genres and whether it streams here. */
export interface TitleFeatures {
  readonly id: string
  readonly genres: readonly string[]
  readonly streamable: boolean
}

/** One title's personal score (watch_for_you); reason is the genre that lifted it most. */
export interface ForYouScore {
  readonly itemId: string
  readonly score: number
  readonly reason: string | null
  readonly opinion: Opinion | null
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000

/**
 * Mirrors public.watch_for_you for the demo and test fakes: genre weight = (likes - dislikes) /
 * (opinions + 2), score = mean weight over the title's genres + 0.1 when it streams here.
 */
export function forYou(
  titles: readonly TitleFeatures[],
  opinions: ReadonlyMap<string, Opinion>,
): ForYouScore[] {
  const tally = new Map<string, { up: number; down: number }>()
  for (const title of titles) {
    const opinion = opinions.get(title.id)
    if (!opinion) continue
    for (const g of title.genres) {
      const t = tally.get(g) ?? { up: 0, down: 0 }
      tally.set(g, opinion === "liked" ? { ...t, up: t.up + 1 } : { ...t, down: t.down + 1 })
    }
  }
  const weight = (g: string) => {
    const t = tally.get(g)
    return t ? (t.up - t.down) / (t.up + t.down + 2) : 0
  }
  return titles.map((title) => {
    const mean = title.genres.length
      ? title.genres.reduce((sum, g) => sum + weight(g), 0) / title.genres.length
      : 0
    const lifting = [...title.genres]
      .filter((g) => weight(g) > 0)
      .sort((a, b) => weight(b) - weight(a) || a.localeCompare(b))
    return {
      itemId: title.id,
      score: round4(mean + (title.streamable ? 0.1 : 0)),
      reason: lifting[0] ?? null,
      opinion: opinions.get(title.id) ?? null,
    }
  })
}

/** list_watch_items' For you key: dislikes first digit 0 so they sort last, then the score. */
export const forYouRank = (s: ForYouScore): string =>
  `${s.opinion === "disliked" ? "0" : "1"}${String(Math.round((s.score + 10) * 10_000)).padStart(6, "0")}`
