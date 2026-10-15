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

/** Confirms the signed-in user's password before a destructive action. */
export interface Reauthenticator {
  reauthenticate(password: string): Promise<Result<void>>
}

/** Shown wherever an author or actor has left the space or deleted their account. */
export const FORMER_MEMBER = "Former member"

export function memberName(members: readonly MemberRef[], id: string | null): string {
  return members.find((m) => m.id === id)?.displayName ?? FORMER_MEMBER
}
