import type { PlayableSource } from "../domain/source.types"
/** Refresh shortly before an advertised URL expires; unknown expiry has no speculative timer. */
export function sourceExpiry(source: PlayableSource | null, refresh: () => void) {
  const expires = Date.parse(source?.expiresAt ?? "")
  if (!Number.isFinite(expires)) return
  const timer = setTimeout(
    refresh,
    Math.min(2_147_483_647, Math.max(0, expires - Date.now() - 5000)),
  )
  return () => clearTimeout(timer)
}
