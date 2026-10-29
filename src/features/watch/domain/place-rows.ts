import type { PersonPlace, PlacesSummary } from "./places-summary"

/** One line on a card: the people at one episode, or everyone left over when lines run out. */
export interface PlaceRow {
  readonly names: readonly string[]
  /** The same people's ids, in the same order. */
  readonly ids: readonly string[]
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
    else
      groups.push({
        names: [person.name],
        ids: [person.userId],
        label: person.label,
        ahead: person.ahead,
      })
  }
  if (groups.length <= lines) return groups
  const kept = groups.slice(0, Math.max(0, lines - 1))
  const folded = groups.slice(kept.length)
  return [
    ...kept,
    {
      names: folded.flatMap((g) => g.names),
      ids: folded.flatMap((g) => g.ids),
      label: null,
      ahead: false,
    },
  ]
}

const join = (row: PlaceRow, person: PersonPlace): PlaceRow => ({
  ...row,
  names: [...row.names, person.name],
  ids: [...row.ids, person.userId],
})
