import { success, type Outcome } from "../http/outcome.ts"
import { failure, isInvalidClient, simklFailure } from "./outcome.ts"
import type { SimklDeps } from "./deps.ts"
import type { SimklLink, SimklTokens } from "./ports.ts"

const DAY_MS = 86_400_000
const WEEK_S = 604_800
const WAITS = 5
const WAIT_MS = 1000

type Loose = Record<string, unknown>
const text = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length <= 512 ? v : null)

/** A token reply's tokens; the refresh token falls back to `keep` (refresh does not rotate). */
export function tokensFrom(body: unknown, now: Date, keep?: string): SimklTokens | null {
  const reply = (typeof body === "object" && body !== null ? body : {}) as Loose
  const accessToken = text(reply.access_token)
  const refreshToken = text(reply.refresh_token) ?? keep ?? null
  const seconds =
    typeof reply.expires_in === "number" && reply.expires_in > 0 ? reply.expires_in : WEEK_S
  if (!accessToken || !refreshToken) return null
  const accessExpiresAt = new Date(now.getTime() + seconds * 1000).toISOString()
  return { accessToken, refreshToken, accessExpiresAt }
}

/** Another sync holds the lease: wait for its new token instead of refreshing over it. */
async function awaitOther(deps: SimklDeps, userId: string, old: string): Promise<Outcome<string>> {
  for (let i = 0; i < WAITS; i++) {
    await deps.sleep(WAIT_MS)
    const link = await deps.store.link(userId)
    if (!link?.accessToken) return failure("denied")
    if (link.accessToken !== old) return success(link.accessToken)
  }
  return failure("rate_limited")
}

/** One refresh, owned by whoever takes the lease. A refused refresh ends the link. */
async function refresh(deps: SimklDeps, userId: string, link: SimklLink, old: string) {
  const { client, store, clock } = deps
  if (!link.refreshToken) return store.remove(userId).then(() => failure("denied"))
  if (!(await store.claimRefresh(userId))) return awaitOther(deps, userId, old)
  const reply = await client.token({
    grant_type: "refresh_token",
    refresh_token: link.refreshToken,
  })
  const tokens = reply.ok ? tokensFrom(reply.body, clock(), link.refreshToken) : null
  if (tokens) {
    await store.saveTokens(userId, tokens, false)
    return success(tokens.accessToken)
  }
  const refused = !reply.ok && (reply.failure === "rejected" || reply.failure === "unauthorized")
  if (!reply.ok && refused && !isInvalidClient(reply)) {
    await store.remove(userId)
    return failure("denied")
  }
  await store.releaseRefresh(userId)
  return reply.ok ? failure("unavailable") : simklFailure(reply)
}

/**
 * The access token to call Simkl with: refreshed when `force` (after a 401) or within a day of
 * expiry. A proactive refresh that meets an outage falls back to the still valid token.
 */
export async function accessToken(
  deps: SimklDeps,
  userId: string,
  link: SimklLink & { accessToken: string },
  force: boolean,
): Promise<Outcome<{ token: string; refreshed: boolean }>> {
  const expires = Date.parse(link.accessExpiresAt ?? "")
  const left = Number.isNaN(expires) ? Infinity : expires - deps.clock().getTime()
  const current = success({ token: link.accessToken, refreshed: false })
  if (!force && left > DAY_MS) return current
  const fresh = await refresh(deps, userId, link, link.accessToken)
  if (fresh.ok) return success({ token: fresh.body, refreshed: true })
  return !force && left > 0 && fresh.kind !== "denied" ? current : fresh
}
