import { memberName, type MemberRef } from "@/shared/domain"
import { aheadOf, placeLabel, type MemberPlace, type Place } from "./places"

export interface PersonPlace {
  readonly userId: string
  readonly name: string
  readonly label: string
  /** Watched further alone than the space has together. */
  readonly ahead: boolean
}

export interface PlacesSummary {
  readonly people: readonly PersonPlace[]
  /** "S1E2", "Watched" for a film, or null before any watch party. */
  readonly together: string | null
}

/** For the list: each person's episode, who is ahead, and the together pointer. */
export function describePlaces(
  places: readonly MemberPlace[],
  together: Place | null,
  names: readonly MemberRef[],
): PlacesSummary {
  const people = places.flatMap((p): PersonPlace[] => {
    const label = placeLabel(p)
    return label
      ? [
          {
            userId: p.userId,
            name: memberName(names, p.userId),
            label,
            ahead: aheadOf(p, together),
          },
        ]
      : []
  })
  const shared = together ? (placeLabel(together) ?? "Watched") : null
  return { people, together: shared }
}
