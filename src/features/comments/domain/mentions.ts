import type { MemberRef } from "@/shared/domain"

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
