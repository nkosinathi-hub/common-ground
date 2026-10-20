import { success, type Outcome } from "../http/outcome.ts"
import type { SimklDeps } from "./deps.ts"
import { failure, simklFailure } from "./outcome.ts"
import { tokensFrom } from "./tokens.ts"

/** What the browser gets to show; the device code stays in simkl_links. */
export interface DeviceStart {
  readonly userCode: string
  readonly verificationUri: string
  readonly verificationUriComplete: string
  readonly interval: number
  readonly expiresIn: number
}

export type PollStatus =
  | { readonly status: "pending"; readonly interval: number }
  | { readonly status: "connected" }
  | { readonly status: "expired" }

type Loose = Record<string, unknown>
const PIN_PAGE = "https://simkl.com/pin"
const DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code"
const SLOW_DOWN_S = 5

const seconds = (v: unknown, fallback: number, max: number) =>
  typeof v === "number" && Number.isInteger(v) && v > 0 && v <= max ? v : fallback

/** Only a page on simkl.com is ever shown to the user as the place to approve. */
const simklPage = (v: unknown) =>
  typeof v === "string" && /^https:\/\/simkl\.com\/[\w/?=&.-]*$/.test(v) ? v : PIN_PAGE

/** POST /oauth2/device for read access; the device code is stored, never returned. */
export async function startDevice(deps: SimklDeps, userId: string): Promise<Outcome<DeviceStart>> {
  const reply = await deps.client.startDevice()
  if (!reply.ok) return simklFailure(reply)
  const body = (typeof reply.body === "object" && reply.body !== null ? reply.body : {}) as Loose
  const { device_code: deviceCode, user_code: userCode } = body
  if (typeof deviceCode !== "string" || !deviceCode || deviceCode.length > 512)
    return failure("unavailable")
  if (typeof userCode !== "string" || !userCode || userCode.length > 32)
    return failure("unavailable")
  const expiresIn = seconds(body.expires_in, 900, 3600)
  const expiresAt = new Date(deps.clock().getTime() + expiresIn * 1000).toISOString()
  await deps.store.startDevice(userId, deviceCode, expiresAt)
  return success({
    userCode,
    verificationUri: simklPage(body.verification_uri),
    verificationUriComplete: simklPage(body.verification_uri_complete ?? body.verification_uri),
    interval: seconds(body.interval, 5, 60),
    expiresIn,
  })
}

const grantsRead = (body: unknown) => {
  const scope = (body as Loose | null)?.scope
  return typeof scope !== "string" || scope.split(/\s+/).includes("media:read")
}

/** One POST /oauth2/token poll with the stored device code, mapped as RFC 8628 says. */
export async function pollDevice(
  deps: SimklDeps,
  userId: string,
  interval: number,
): Promise<Outcome<PollStatus>> {
  const { client, store, clock } = deps
  const link = await store.link(userId)
  if (!link?.deviceCode)
    return success(link?.accessToken ? { status: "connected" } : { status: "expired" })
  const expired = async () => (
    await store.clearDevice(userId),
    success({ status: "expired" as const })
  )
  if (Date.parse(link.deviceExpiresAt ?? "") <= clock().getTime()) return expired()
  const reply = await client.token({ grant_type: DEVICE_GRANT, device_code: link.deviceCode })
  if (reply.ok) {
    const tokens = tokensFrom(reply.body, clock())
    if (!tokens) return failure("unavailable")
    if (!grantsRead(reply.body)) {
      await store.clearDevice(userId)
      return failure("denied", "Simkl did not grant read access to your history. Connect again")
    }
    await store.saveTokens(userId, tokens, true)
    return success({ status: "connected" })
  }
  if (reply.error === "authorization_pending") return success({ status: "pending", interval })
  if (reply.error === "slow_down")
    return success({ status: "pending", interval: interval + SLOW_DOWN_S })
  if (reply.error === "expired_token") return expired()
  return simklFailure(reply)
}
