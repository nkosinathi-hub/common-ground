import { FEELING_WORDS } from "./hard-talk-copy"

/** "How I feel" as chips and the writer's own words; stored as one line of text. */
export interface Feelings {
  readonly words: readonly string[]
  readonly own: string
}

const known = (word: string) => (FEELING_WORDS as readonly string[]).includes(word)

/** Reads a stored line back: suggested words become chips, the rest stays the writer's own. */
export function readFeelings(text: string): Feelings {
  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
  const words = parts.filter(known)
  return { words: [...new Set(words)], own: parts.filter((part) => !known(part)).join(", ") }
}

/** "worried, left out, a bit unseen": the chips first, then the own words. */
export const writeFeelings = ({ words, own }: Feelings): string =>
  [...words, own.trim()].filter(Boolean).join(", ")

/** Suggestions not yet chosen, in their usual order. */
export const feelingSuggestions = (chosen: readonly string[]): string[] =>
  FEELING_WORDS.filter((word) => !chosen.includes(word))
