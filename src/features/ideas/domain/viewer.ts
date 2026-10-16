/** Who is looking at an idea: their user id and whether they own the space. */
export interface Viewer {
  readonly me: string
  readonly isOwner: boolean
}

/** Mirrors the delete policies: only the author or the space owner may delete idea content. */
export const canDelete = (createdBy: string | null, viewer: Viewer): boolean =>
  viewer.isOwner || (createdBy !== null && createdBy === viewer.me)
