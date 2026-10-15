import type { ActiveSpaceStore } from "../application/ports"

const KEY = "common-ground:active-space"

/** Only the space id is stored locally. Storage can be unavailable (private mode). */
export class LocalActiveSpace implements ActiveSpaceStore {
  read(): string | null {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  }

  write(spaceId: string | null): void {
    try {
      if (spaceId) localStorage.setItem(KEY, spaceId)
      else localStorage.removeItem(KEY)
    } catch {
      /* storage unavailable: nothing to remember */
    }
  }
}
