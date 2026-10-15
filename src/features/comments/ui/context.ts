import { getContext, setContext } from "svelte"
import type { CommentsService } from "../application/comments-service"

/** Context key under which src/app/composition.ts provides the CommentsService. */
export const COMMENTS_CONTEXT = Symbol("comments-service")

export const provideComments = (service: CommentsService): CommentsService =>
  setContext(COMMENTS_CONTEXT, service)

export function useComments(): CommentsService {
  const service = getContext<CommentsService | undefined>(COMMENTS_CONTEXT)
  if (!service) throw new Error("CommentsService is not provided: call provideComments")
  return service
}
