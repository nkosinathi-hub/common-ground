import type { MemberRef } from "@/shared/domain"
import { Resource } from "@/shared/ui"
import { useWatch } from "./context"

/**
 * Names for a space's place badges, loaded once per list rather than once per card. Includes
 * people who have left, so their old progress still has a name. Call during component setup.
 */
export function spaceNames(spaceId: () => string): Resource<MemberRef[]> {
  const { authors } = useWatch()
  const names = new Resource(() => authors.authors(spaceId()))
  $effect(() => {
    void spaceId()
    void names.load()
  })
  return names
}
