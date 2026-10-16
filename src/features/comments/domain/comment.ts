import { appError, err, ok, type Cursor, type MemberRef, type Result } from "@/shared/domain"

export type ParentKind = "watch" | "idea"

/** Who is reading a thread: decides what they may change and how authors are named. */
export interface Viewer {
  readonly me: string
  readonly isOwner: boolean
  /** Names authors and mentions: current members, then removed people still visible. */
  readonly authors: readonly MemberRef[]
}

/** What a thread hangs off: a saved title or an idea. */
export interface ParentRef {
  readonly kind: ParentKind
  readonly id: string
}

export interface Comment extends Cursor {
  readonly spaceId: string
  readonly parent: ParentRef
  readonly authorId: string | null
  readonly body: string
  readonly spoiler: boolean
  readonly edited: boolean
  /** Chosen explicitly in the composer; never parsed out of the body. */
  readonly mentionIds: readonly string[]
}

export const BODY_MAX = 4000

export function validateBody(body: string): Result<string> {
  const trimmed = body.trim()
  return trimmed.length >= 1 && trimmed.length <= BODY_MAX
    ? ok(trimmed)
    : err(appError("validation", `Write something (up to ${BODY_MAX} characters)`, "body"))
}

export const canEdit = (comment: Comment, me: string): boolean =>
  comment.authorId !== null && comment.authorId === me

/** Authors remove their own comments; the space owner moderates everyone's. */
export const canDelete = (comment: Comment, me: string, isOwner: boolean): boolean =>
  isOwner || canEdit(comment, me)

export const isConcealed = (comment: Comment, revealed: ReadonlySet<string>): boolean =>
  comment.spoiler && !revealed.has(comment.id)
