export type CallbackNext = "home" | "new-password"

export type AuthCallback =
  | { readonly kind: "none" }
  | { readonly kind: "code"; readonly code: string; readonly next: CallbackNext }
  | { readonly kind: "error"; readonly reason: "expired" | "invalid" }

/** Reads Supabase's PKCE redirect: `?code=` (or `?error=`) arrives before the hash. */
export function parseAuthCallback(search: string, hash: string): AuthCallback {
  const query = new URLSearchParams(search)
  const fragment = new URLSearchParams(hash.replace(/^#/, ""))
  const error =
    query.get("error_code") ??
    query.get("error") ??
    fragment.get("error_code") ??
    fragment.get("error")
  if (error)
    return { kind: "error", reason: /expired|otp_expired/.test(error) ? "expired" : "invalid" }
  const code = query.get("code")
  if (!code) return { kind: "none" }
  return {
    kind: "code",
    code,
    next: query.get("next") === "new-password" ? "new-password" : "home",
  }
}

/** Redirect target for emails: the app root under the Pages base path, plus a `next` hint. */
export function callbackUrl(origin: string, basePath: string, next: CallbackNext): string {
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`
  return `${origin}${base}?next=${next}`
}

/** URL to restore after the callback, with auth parameters scrubbed. */
export function scrubbedUrl(pathname: string, hash: string): string {
  return /(^|[#&])(error|access_token)=/.test(hash) ? pathname : `${pathname}${hash}`
}
