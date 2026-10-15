const KEY = "common-ground:pending-invite"

/** An invite opened while signed out is resumed after sign-in. Session-scoped only. */
export const pendingInvite = {
  read: (): string | null => safe(() => sessionStorage.getItem(KEY)),
  write: (token: string | null) =>
    safe(() => (token ? sessionStorage.setItem(KEY, token) : sessionStorage.removeItem(KEY))),
}

function safe<T>(fn: () => T): T | null {
  try {
    return fn()
  } catch {
    return null
  }
}
