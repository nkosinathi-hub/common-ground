import type { PersonPlace, PlacesSummary } from "./places-summary"

/** One line on a card: the people at one episode, or everyone left over when lines run out. */
export interface PlaceRow {
  readonly names: readonly string[]
  /** "S1E2"; null on the overflow line, which names how many more instead. */
  readonly label: string | null
  readonly ahead: boolean
}

/**
 * The person lines a card shows under the together line, never more than `lines`: people at
 * the same episode share a line, and once the lines run out the rest share the last one. A
 * card is the same height for two people or ten.
 */
export function placeRows(summary: PlacesSummary, lines: number): PlaceRow[] {
  const groups: PlaceRow[] = []
  for (const person of summary.people) {
    const same = groups.find((g) => g.label === person.label)
    if (same) groups[groups.indexOf(same)] = join(same, person)
    else groups.push({ names: [person.name], label: person.label, ahead: person.ahead })
  }
  if (groups.length <= lines) return groups
  const kept = groups.slice(0, Math.max(0, lines - 1))
  const rest = groups.slice(kept.length).flatMap((g) => g.names)
  return [...kept, { names: rest, label: null, ahead: false }]
}

const join = (row: PlaceRow, person: PersonPlace): PlaceRow => ({
  ...row,
  names: [...row.names, person.name],
})
