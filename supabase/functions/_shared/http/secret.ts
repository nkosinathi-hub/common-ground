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

/** A server-to-server action runs only with its configured secret; short or unset denies all. */
export function isSecretAuthorized(provided: string | null, configured: string): boolean {
  if (configured.length < MIN_SECRET_LENGTH || !provided) return false
  return sameText(provided, configured)
}
