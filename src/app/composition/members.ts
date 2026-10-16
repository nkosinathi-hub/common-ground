import { getContext, setContext } from "svelte"
import type { SpacesService } from "@/features/spaces"
import { ok, type AuthorDirectory, type MemberDirectory, type MemberRef } from "@/shared/domain"

type Membership = Pick<SpacesService, "members" | "knownPeople">

/** Adapts space membership to the shared member directory other features depend on. */
export function memberDirectory(spaces: Pick<SpacesService, "members">): MemberDirectory {
  return {
    async members(spaceId) {
      const list = await spaces.members(spaceId)
      return list.ok
        ? ok(list.value.map((m) => ({ id: m.userId, displayName: m.displayName })))
        : list
    },
  }
}

/**
 * The attribution rule: a current member by their name in this space; someone removed (or who
 * left) by their profile name while the viewer can still see it; otherwise "Former member".
 */
export function authorDirectory(spaces: Membership): AuthorDirectory {
  const current = memberDirectory(spaces)
  return {
    async authors(spaceId) {
      const [members, known] = await Promise.all([current.members(spaceId), spaces.knownPeople()])
      if (!members.ok) return members
      if (!known.ok) return known
      const ids = new Set(members.value.map((m) => m.id))
      const others: MemberRef[] = known.value.filter((person) => !ids.has(person.id))
      return ok([...members.value, ...others])
    },
  }
}

const KEY = Symbol("members")

export interface MembersContext {
  /** Current members, for pickers. */
  readonly members: MemberDirectory
  /** Current members and still-visible former ones, for naming authors. */
  readonly authors: AuthorDirectory
}

/** The space's members for src/app pages that hand a member list to several features. */
export function provideMembers(value: MembersContext): void {
  setContext(KEY, value)
}

export function useMembers(): MembersContext {
  const value = getContext<MembersContext | undefined>(KEY)
  if (!value) throw new Error("Members are not provided: call provideMembers")
  return value
}
