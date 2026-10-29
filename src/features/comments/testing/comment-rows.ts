import type { Cursor } from "@/shared/domain"
import type { NewComment, ThreadFilter, ThreadPageRequest } from "../application/ports"
import type { Comment, ParentRef } from "../domain/comment"
import { isAhead } from "../domain/episodes"

export const START = Date.parse("2026-10-15T10:00:00.000Z")
const newestFirst = (a: Comment, b: Comment) =>
  b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
const olderThan = (c: Comment, cursor: Cursor) =>
  c.createdAt < cursor.createdAt || (c.createdAt === cursor.createdAt && c.id < cursor.id)
export const sameParent = (a: ParentRef, b: ParentRef) => a.kind === b.kind && a.id === b.id

/** A comment as the database first stores it: no hearts or replies yet. */
export const fresh = (
  fields: Omit<Comment, "replyTo" | "tag" | "hearts" | "hearted" | "replies"> & Partial<Comment>,
): Comment => ({
  replyTo: null,
  tag: null,
  hearts: 0,
  hearted: false,
  replies: 0,
  ...fields,
})

function passes(c: Comment, filter: ThreadFilter | undefined): boolean {
  const episode = filter?.episode
  if (episode && (c.tag?.season !== episode.season || c.tag.episode !== episode.episode))
    return false
  return !(filter && "upTo" in filter && isAhead(c.tag, filter.upTo ?? null))
}

/** The rows a page query selects, newest first, with the same rules as the database. */
export const selected = (rows: readonly Comment[], r: ThreadPageRequest) =>
  rows
    .filter((c) => c.spaceId === r.spaceId && sameParent(c.parent, r.parent))
    .filter((c) => (r.replyTo ? c.replyTo === r.replyTo : c.replyTo === null))
    .filter((c) => passes(c, r.filter))
    .filter((c) => !r.after || olderThan(c, r.after))
    .sort(newestFirst)

/** As post_comment: a reply joins its comment's thread and shares its episode. */
export function threadOf(rows: readonly Comment[], input: NewComment) {
  const root = input.replyTo ? rows.find((c) => c.id === input.replyTo) : undefined
  return root
    ? { replyTo: root.replyTo ?? root.id, tag: root.tag }
    : { replyTo: null, tag: input.tag ?? null }
}
