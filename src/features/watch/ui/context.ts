import { getContext, setContext } from "svelte"
import type { AuthorDirectory, MemberDirectory } from "@/shared/domain"
import type { WatchHistory } from "../application/watch-history"
import type { WatchOpinions } from "../application/watch-opinions"
import type { WatchService } from "../application/watch-service"

export interface WatchContext {
  readonly service: WatchService
  /** Current members of the space, for picking who was there. */
  readonly members: MemberDirectory
  /** Names for progress and sessions, including removed people still visible to the viewer. */
  readonly authors: AuthorDirectory
  /** Episode history: each episode's status for the Episodes tab. */
  readonly history?: WatchHistory
  /** Like / dislike, private to the signed-in person. */
  readonly opinions?: WatchOpinions
}

const KEY = Symbol("watch")

export function provideWatch(value: WatchContext): void {
  setContext(KEY, value)
}

export function useWatch(): WatchContext {
  const value = getContext<WatchContext | undefined>(KEY)
  if (!value) throw new Error("Watch is not provided: call provideWatch in the composition root")
  return value
}
