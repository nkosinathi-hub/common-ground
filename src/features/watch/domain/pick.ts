import type { WatchItem } from "./types"

export type RandomSource = () => number

export const togetherQueue = (items: readonly WatchItem[]): WatchItem[] =>
  items.filter((i) => i.intent === "watch_together")

/**
 * Picks a random title from the watch-together queue. On retry, pass the previous pick so the
 * same title is not offered twice in a row while there is anything else to choose.
 */
export function pickForUs(
  items: readonly WatchItem[],
  random: RandomSource = Math.random,
  previousId?: string,
): WatchItem | null {
  const queue = togetherQueue(items)
  const choices = queue.length > 1 ? queue.filter((i) => i.id !== previousId) : queue
  if (choices.length === 0) return null
  const index = Math.min(Math.floor(random() * choices.length), choices.length - 1)
  return choices[index] ?? null
}
