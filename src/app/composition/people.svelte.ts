import type { MemberRef } from "@/shared/domain"
import { Resource } from "@/shared/ui"
import type { MembersContext } from "./members"

/**
 * A space's current members (for pickers) and author names, loaded once when the page mounts.
 * Pages pass `useMembers()`; a change of space remounts the page.
 */
export function spacePeople(directory: MembersContext, spaceId: () => string) {
  const people = new Resource(() => directory.members.members(spaceId()))
  const names = new Resource(() => directory.authors.authors(spaceId()))
  $effect(() => {
    void people.load()
    void names.load()
  })
  return {
    get members(): MemberRef[] {
      return people.value ?? []
    },
    get authors(): MemberRef[] {
      return names.value ?? people.value ?? []
    },
  }
}
