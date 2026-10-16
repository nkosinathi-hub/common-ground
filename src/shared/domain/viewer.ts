/** Who is looking: their user id and whether they own the space. */
export interface Viewer {
  readonly me: string
  readonly isOwner: boolean
}

/**
 * The author-or-owner rule every delete policy in SQL follows (ideas, research, tasks, budget,
 * comments, attachments, events): the author, or the space owner, may delete. A departed author
 * (null) leaves it to the owner.
 */
export const canDelete = (createdBy: string | null, viewer: Viewer): boolean =>
  viewer.isOwner || (createdBy !== null && createdBy === viewer.me)
