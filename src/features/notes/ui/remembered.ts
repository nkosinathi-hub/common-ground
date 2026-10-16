/** A per-device yes/no in localStorage, which may be missing or throw: never fail on it. */
export function remembered(key: string) {
  return {
    get(): boolean {
      try {
        return localStorage.getItem(key) === "1"
      } catch {
        return false
      }
    },
    set(on: boolean): void {
      try {
        if (on) localStorage.setItem(key, "1")
        else localStorage.removeItem(key)
      } catch {
        // A convenience only: without storage the default shows again next time.
      }
    },
  }
}
