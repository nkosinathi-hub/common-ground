import type { SpacesService } from "@/features/spaces"
import { ok, type Result } from "@/shared/domain"

export interface MemberRef {
  readonly id: string
  readonly displayName: string
}

/** Adapts space membership to the small directory other features need (pickers, assignees). */
export function memberDirectory(spaces: SpacesService) {
  return {
    async members(spaceId: string): Promise<Result<MemberRef[]>> {
      const list = await spaces.members(spaceId)
      return list.ok
        ? ok(list.value.map((m) => ({ id: m.userId, displayName: m.displayName })))
        : list
    },
  }
}
