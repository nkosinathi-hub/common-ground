import type { PartyMember } from "./party"
import type { Presence } from "./presence"

/**
 * Everyone in the party: members as the page loaded them, then anyone present on the channel
 * who joined after (their membership row is newer than the page). Each person once.
 */
export function whoIsIn(members: readonly PartyMember[], people: readonly Presence[]): string[] {
  const ids = members.map((m) => m.userId)
  for (const person of people) if (!ids.includes(person.userId)) ids.push(person.userId)
  return ids
}
