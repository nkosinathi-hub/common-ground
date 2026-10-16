import { memberName, type AuthorDirectory, type MemberRef } from "@/shared/domain"
import type { Note, NoteReply } from "../domain"
import type { NoteRecord, ReplyRecord } from "./ports"

const later = (a: string | null, b: string | null) =>
  a === null || (b !== null && Date.parse(b) > Date.parse(a)) ? b : a

/**
 * Resolves names. A gentle response counts like a reply, so it makes the note new again for
 * the author until they open it.
 */
export const toNote = (members: readonly MemberRef[], n: NoteRecord): Note => ({
  ...n,
  lastReplyAt: later(n.lastReplyAt, n.latestResponse?.at ?? null),
  authorName: memberName(members, n.authorId),
  recipient:
    n.recipientId === null
      ? { kind: "everyone" }
      : { kind: "member", id: n.recipientId, name: memberName(members, n.recipientId) },
})

export const toReply = (members: readonly MemberRef[], r: ReplyRecord): NoteReply => ({
  ...r,
  authorName: memberName(members, r.authorId),
})

/** Maps with member names; a lookup failure falls back to "Former member" rather than hiding. */
export async function withNames<T, U>(
  names: AuthorDirectory,
  spaceId: string,
  value: T,
  map: (people: MemberRef[], value: T) => U,
): Promise<U> {
  const people = await names.authors(spaceId)
  return map(people.ok ? people.value : [], value)
}
