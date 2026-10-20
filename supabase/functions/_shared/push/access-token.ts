import { signAssertion } from "./jwt.ts"
import type { ServiceAccount } from "./service-account.ts"

export type Fetch = (url: string, init: RequestInit) => Promise<Response>

const JWT_BEARER = "urn:ietf:params:oauth:grant-type:jwt-bearer"
const EARLY_REFRESH_MS = 60_000

/**
 * Google OAuth access tokens for FCM, cached until a minute before they expire, so a warm
 * function signs at most one assertion an hour. Failures carry no detail from Google.
 */
export function createTokenSource(
  account: ServiceAccount,
  fetchFn: Fetch,
  now: () => number = Date.now,
): () => Promise<string> {
  let cached: { readonly token: string; readonly expiresAt: number } | null = null

  return async () => {
    if (cached && cached.expiresAt - EARLY_REFRESH_MS > now()) return cached.token
    const assertion = await signAssertion(account, Math.floor(now() / 1000))
    const response = await fetchFn(account.tokenUri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: JWT_BEARER, assertion }).toString(),
    })
    const body = response.ok
      ? ((await response.json()) as { access_token?: unknown; expires_in?: unknown })
      : {}
    if (typeof body.access_token !== "string") throw new Error("access token request failed")
    const lifetime = typeof body.expires_in === "number" ? body.expires_in : 3600
    cached = { token: body.access_token, expiresAt: now() + lifetime * 1000 }
    return cached.token
  }
}
