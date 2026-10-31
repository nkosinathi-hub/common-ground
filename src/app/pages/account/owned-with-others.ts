import type { SpacesService } from "@/features/spaces"

interface Owned {
  readonly id: string
  readonly name: string
  readonly role: string
}

/** Spaces where this person is the last owner and others still belong: deletion waits on them. */
export async function ownedWithOthers(service: SpacesService, spaces: readonly Owned[]) {
  const owned = spaces.filter((space) => space.role === "owner")
  const counts = await Promise.all(owned.map((space) => service.members(space.id)))
  return owned
    .filter((_, i) => {
      const members = counts[i]!
      if (!members.ok) return false
      const owners = members.value.filter((m) => m.role === "owner").length
      return members.value.length > 1 && owners === 1
    })
    .map((space) => space.name)
}
