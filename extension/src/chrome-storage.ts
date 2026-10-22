import type { SupportedStorage } from "@supabase/supabase-js"

/** The part of chrome.storage.local the extension uses (the only permission it asks for). */
export interface StorageArea {
  get(key: string): Promise<Record<string, unknown>>
  set(values: Record<string, unknown>): Promise<void>
  remove(key: string): Promise<void>
}

interface StorageChange {
  readonly newValue?: unknown
}

/** The few chrome.* APIs the extension calls; declared here rather than pulling in @types/chrome. */
interface Chrome {
  readonly storage: {
    readonly local: StorageArea
    readonly onChanged: {
      addListener(listener: (changes: Record<string, StorageChange>, area: string) => void): void
    }
  }
}

declare const chrome: Chrome

export const local = (): StorageArea => chrome.storage.local

/** The party this member joined in the popup; the content script on netflix.com plays it. */
export const ACTIVE_PARTY = "cg.activeParty"

/** supabase-js auth storage over chrome.storage.local, so the popup and the tab share a session. */
export const chromeStorage = (area: StorageArea): SupportedStorage => ({
  async getItem(key) {
    const value = (await area.get(key))[key]
    return typeof value === "string" ? value : null
  },
  setItem: (key, value) => area.set({ [key]: value }),
  removeItem: (key) => area.remove(key),
})

export async function activeParty(area: StorageArea): Promise<string | null> {
  const value = (await area.get(ACTIVE_PARTY))[ACTIVE_PARTY]
  return typeof value === "string" ? value : null
}

export const setActiveParty = (area: StorageArea, partyId: string | null): Promise<void> =>
  partyId ? area.set({ [ACTIVE_PARTY]: partyId }) : area.remove(ACTIVE_PARTY)

/** Calls back when the joined party changes, or the session does (sign in, sign out). */
export function onStorageChange(listener: (keys: readonly string[]) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") listener(Object.keys(changes))
  })
}
