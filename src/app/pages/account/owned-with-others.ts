import type { SpacesService } from "@/features/spaces"

interface Owned {
  readonly id: string
  readonly name: string
  readonly role: string
}

/** The names of spaces this person owns with other members: account deletion waits on them. */
export async function ownedWithOthers(service: SpacesService, spaces: readonly Owned[]) {
  const owned = spaces.filter((space) => space.role === "owner")
  const counts = await Promise.all(owned.map((space) => service.members(space.id)))
  return owned
    .filter((_, i) => {
      const members = counts[i]!
      return members.ok && members.value.length > 1
    })
    .map((space) => space.name)
}
