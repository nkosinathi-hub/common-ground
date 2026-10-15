import { getContext, setContext } from "svelte"
import type { MemberDirectory } from "../application/ports"
import type { WatchService } from "../application/watch-service"

export const WATCH_CONTEXT = Symbol("watch")

export interface WatchContext {
  readonly service: WatchService
  readonly members: MemberDirectory
}

export const provideWatch = (value: WatchContext): WatchContext => setContext(WATCH_CONTEXT, value)

export function useWatch(): WatchContext {
  const value = getContext<WatchContext | undefined>(WATCH_CONTEXT)
  if (!value) throw new Error("Watch is not provided: call provideWatch in the composition root")
  return value
}
