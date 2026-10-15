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
