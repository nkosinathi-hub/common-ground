import type { DeviceStore } from "@/shared/domain"

const KEY = "opened-links"
const KEEP = 10

function remembered(store: DeviceStore): string[] {
  try {
    const value: unknown = JSON.parse(store.read(KEY) ?? "[]")
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []
  } catch {
    return []
  }
}

/**
 * Android reports the link that launched the app again after every reload. Opening a link
 * reloads the page, so each one is let through once per app session (a session store).
 */
export function firstTime(store: DeviceStore, link: string): boolean {
  const seen = remembered(store)
  if (seen.includes(link)) return false
  store.write(KEY, JSON.stringify([...seen, link].slice(-KEEP)))
  return true
}
