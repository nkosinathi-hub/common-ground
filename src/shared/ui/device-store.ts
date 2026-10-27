import type { DeviceStore } from "@/shared/domain"

// The only module that touches web storage (scripts/guard/storage-rule.ts), so every key carries
// the prefix and sign-out can forget them all. `cg.` is the prefix v0.2 used for a few keys.
const PREFIX = "common-ground:"
const LEGACY = "cg."
const sampleValues = new Map<string, string>()
const samplePreview = () => new URLSearchParams(location.search).get("demo") === "1"

type Area = "local" | "session"
const area = (where: Area): Storage => (where === "local" ? localStorage : sessionStorage)

function attempt<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback // private windows and blocked site data: storage is a convenience only
  }
}

export function deviceStore(where: Area = "local"): DeviceStore {
  if (samplePreview())
    return {
      read: (key) => sampleValues.get(`${where}:${key}`) ?? null,
      write: (key, value) => {
        if (value === null) sampleValues.delete(`${where}:${key}`)
        else sampleValues.set(`${where}:${key}`, value)
      },
    }
  return {
    read: (key) => attempt(() => area(where).getItem(PREFIX + key), null),
    write: (key, value) =>
      attempt(() => {
        if (value === null) area(where).removeItem(PREFIX + key)
        else area(where).setItem(PREFIX + key, value)
      }, undefined),
  }
}

// Links the Android app already opened (src/app/native/launch.ts): not personal data, and
// forgetting them would replay the link that launched the app on its next reload.
const KEEP = new Set([`${PREFIX}opened-links`])

function forget(storage: Storage): void {
  const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i) ?? "")
  const mine = (k: string) => (k.startsWith(PREFIX) || k.startsWith(LEGACY)) && !KEEP.has(k)
  for (const key of keys.filter(mine)) storage.removeItem(key)
}

/** Sign-out: remove everything this app stored on the device, except the light or dark choice. */
export function clearDeviceData(): void {
  if (samplePreview()) return sampleValues.clear()
  for (const where of ["local", "session"] as const) attempt(() => forget(area(where)), undefined)
}
