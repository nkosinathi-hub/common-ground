export interface Release {
  readonly version: string
  readonly apk: string
}

const VERSION = /^\d+\.\d+\.\d+$/

/** True when `latest` is a later x.y.z than `current`. */
export function isNewer(latest: string, current: string): boolean {
  if (!VERSION.test(latest) || !VERSION.test(current)) return false
  const a = latest.split(".").map(Number)
  const b = current.split(".").map(Number)
  const diff = a.map((part, i) => part - b[i]!).find((d) => d !== 0)
  return (diff ?? 0) > 0
}

/** The website's app/version.json; the APK must be served by the same site. */
export function parseRelease(data: unknown, folderUrl: string): Release | null {
  if (typeof data !== "object" || data === null) return null
  const { version, apk } = data as Record<string, unknown>
  if (typeof version !== "string" || typeof apk !== "string") return null
  const url = new URL(apk, folderUrl)
  if (url.origin !== new URL(folderUrl).origin) return null
  return { version, apk: url.href }
}
