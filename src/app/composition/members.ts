import { getContext, setContext } from "svelte"
import type { SpacesService } from "@/features/spaces"
import { ok, type MemberDirectory } from "@/shared/domain"

/** Adapts space membership to the shared member directory other features depend on. */
export function memberDirectory(spaces: SpacesService): MemberDirectory {
  return {
    async members(spaceId) {
      const list = await spaces.members(spaceId)
      return list.ok
        ? ok(list.value.map((m) => ({ id: m.userId, displayName: m.displayName })))
        : list
    },
  }
}

const KEY = Symbol("members")

export interface MembersContext {
  readonly members: MemberDirectory
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
