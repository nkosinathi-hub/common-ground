/** A space member as the thread needs them: an id to store and a name to show. */
export interface MemberRef {
  readonly id: string
  readonly displayName: string
}

export const FORMER_MEMBER = "Former member"

/** Members the composer may mention: everyone but me and those already chosen. */
export function mentionCandidates(
  members: readonly MemberRef[],
  query: string,
  me: string,
  chosen: readonly string[],
): MemberRef[] {
  const needle = query.trim().toLocaleLowerCase()
  return members
    .filter((m) => m.id !== me && !chosen.includes(m.id))
    .filter((m) => m.displayName.toLocaleLowerCase().includes(needle))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }))
}

export const nameOf = (id: string | null, members: readonly MemberRef[]): string =>
  members.find((m) => m.id === id)?.displayName ?? FORMER_MEMBER

export const namesOf = (ids: readonly string[], members: readonly MemberRef[]): string[] =>
  ids.map((id) => nameOf(id, members))
