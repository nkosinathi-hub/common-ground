/**
 * In a Netflix party (#66) a member can be in twice: 'player' is the browser extension driving
 * their netflix.com player, 'remote' the app beside it. Other parties leave the role out.
 */
export type PresenceRole = "player" | "remote"

/** What each member shows in presence. Ready needs a tap, so a browser lets the start play. */
export interface Presence {
  readonly userId: string
  readonly ready: boolean
  readonly buffering: boolean
  readonly joinedAt: string
  readonly role?: PresenceRole
}

/** Whether a player is connected: anyone's, or the given member's. */
export const hasPlayer = (people: readonly Presence[], userId?: string): boolean =>
  people.some((p) => p.role === "player" && (userId === undefined || p.userId === userId))

/** Who a start waits for: everyone but remotes when anyone plays, else everyone present. */
export function awaited(people: readonly Presence[]): readonly Presence[] {
  const playing = people.filter((p) => p.role !== "remote")
  return playing.length > 0 ? playing : people
}
