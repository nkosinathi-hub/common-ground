import type { Result } from "./result"

/** A current member of a space, as other features see them. */
export interface MemberRef {
  readonly id: string
  readonly displayName: string
}

/** Lists a space's current members for pickers, assignees and attribution. */
export interface MemberDirectory {
  members(spaceId: string): Promise<Result<MemberRef[]>>
}

/**
 * Names authors and actors: the space's current members first, then anyone else whose profile the
 * viewer can still see (a removed member who shares another space with them). Pickers use
 * MemberDirectory; attribution uses this.
 */
export interface AuthorDirectory {
  authors(spaceId: string): Promise<Result<MemberRef[]>>
}

/** Confirms the signed-in user's password before a destructive action. */
export interface Reauthenticator {
  reauthenticate(password: string): Promise<Result<void>>
}

/**
 * Shown for an author or actor whose profile the viewer can no longer see: a deleted account, or
 * someone who left or was removed and shares no other space with the viewer.
 */
export const FORMER_MEMBER = "Former member"

export function memberName(members: readonly MemberRef[], id: string | null): string {
  return members.find((m) => m.id === id)?.displayName ?? FORMER_MEMBER
}
