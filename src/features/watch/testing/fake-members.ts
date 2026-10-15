import { ok } from "@/shared/domain"
import type { MemberDirectory } from "../application/ports"
import type { SpaceMember, WatchItem } from "../domain/types"
import { ME, PARTNER } from "./fixtures"

export class FakeMemberDirectory implements MemberDirectory {
  list: SpaceMember[] = [
    { id: ME, displayName: "Nkosi" },
    { id: PARTNER, displayName: "Lindi" },
  ]
  members = async () => ok([...this.list])
}

/** The two unique rules of watch_items: catalog id per type, or manual title per media type. */
export function isDuplicate(items: readonly WatchItem[], extra: Partial<WatchItem>, title: string) {
  return items.some((i) =>
    extra.catalog
      ? i.catalog?.type === extra.catalog.type && i.catalog.id === extra.catalog.id
      : !i.catalog &&
        i.title.toLowerCase() === title.toLowerCase() &&
        i.mediaType === extra.mediaType,
  )
}
