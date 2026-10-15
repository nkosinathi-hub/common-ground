export const CLEANUP_HEADER = "x-cleanup-secret"
const MIN_SECRET_LENGTH = 32

/** Constant-time comparison so the secret cannot be guessed byte by byte from timing. */
function sameText(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a)
  const right = new TextEncoder().encode(b)
  let difference = left.length ^ right.length
  for (let i = 0; i < Math.max(left.length, right.length); i++)
    difference |= (left[i] ?? 0) ^ (right[i] ?? 0)
  return difference === 0
}

/** The cleanup action runs only with the configured secret; a short or unset secret denies all. */
export function isCleanupAuthorized(provided: string | null, configured: string): boolean {
  if (configured.length < MIN_SECRET_LENGTH || !provided) return false
  return sameText(provided, configured)
}
