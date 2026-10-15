import { getContext, setContext } from "svelte"
import type { CommentsService } from "../application/comments-service"

const KEY = Symbol("comments")

export interface CommentsContext {
  readonly service: CommentsService
}

/** Called once by the composition root (src/app/composition). */
export function provideComments(value: CommentsContext): void {
  setContext(KEY, value)
}

export function useComments(): CommentsContext {
  const value = getContext<CommentsContext | undefined>(KEY)
  if (!value) throw new Error("Comments are not provided: call provideComments")
  return value
}

/** The context map for render({ context }) in component tests. */
export const commentsContext = (value: CommentsContext) => new Map([[KEY, value]])
