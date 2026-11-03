const listeners = new Set<(spaceId: string) => void>()
export const watchChanged = (spaceId: string) => {
  for (const notify of listeners) notify(spaceId)
}
export const onWatchChanged = (notify: (spaceId: string) => void) => {
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
  }
}
