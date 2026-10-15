/** Hosts whose country-level watch pages may be linked. Provider deep links are never built. */
export const WATCH_LINK_HOSTS = new Set(["www.themoviedb.org", "www.justwatch.com"])

export function safeWatchLink(value: unknown): string | null {
  if (typeof value !== "string") return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" && WATCH_LINK_HOSTS.has(url.hostname) ? url.href : null
  } catch {
    return null
  }
}
