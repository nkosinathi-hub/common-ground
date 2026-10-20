import { success, type Outcome } from "../http/outcome.ts"
import { failure, simklFailure } from "./outcome.ts"
import type { SimklStore } from "./ports.ts"
import type { SimklClient } from "./simkl-client.ts"
import { syncUser, type SyncResult } from "./sync.ts"

export interface PinStart {
  readonly userCode: string
  readonly verificationUrl: string
  /** Seconds the code stays valid, and between polls, as Simkl advises. */
  readonly expiresIn: number
  readonly interval: number
}

export interface SimklService {
  pin(): Promise<Outcome<PinStart>>
  poll(userId: string, userCode: string): Promise<Outcome<{ connected: boolean }>>
  sync(userId: string): Promise<Outcome<SyncResult>>
  disconnect(userId: string): Promise<Outcome<{ connected: false }>>
}

interface ServiceDeps {
  readonly client: SimklClient
  readonly store: SimklStore
  readonly clock: () => Date
}

type Loose = Record<string, unknown>
const asObject = (v: unknown): Loose => (typeof v === "object" && v !== null ? (v as Loose) : {})

const PIN_PAGE = "https://simkl.com/pin"
const DEFAULTS = { expiresIn: 900, interval: 5 }

const seconds = (value: unknown, fallback: number, max: number) =>
  typeof value === "number" && Number.isInteger(value) && value > 0 && value <= max
    ? value
    : fallback

/** Only a page on simkl.com is ever shown to the user as the place to enter the code. */
const pinPage = (value: unknown) =>
  typeof value === "string" && /^https:\/\/simkl\.com\/[\w/-]*$/.test(value) ? value : PIN_PAGE

export function createSimklService(deps: ServiceDeps): SimklService {
  const { client, store } = deps
  return {
    async pin() {
      const reply = await client.startPin()
      if (!reply.ok) return simklFailure(reply.failure)
      const body = asObject(reply.body)
      if (typeof body.user_code !== "string" || body.user_code.length === 0)
        return failure("unavailable")
      return success({
        userCode: body.user_code,
        verificationUrl: pinPage(body.verification_url ?? body.verification_uri),
        expiresIn: seconds(body.expires_in, DEFAULTS.expiresIn, 3600),
        interval: seconds(body.interval, DEFAULTS.interval, 60),
      })
    },

    async poll(userId, userCode) {
      const reply = await client.pollPin(userCode)
      if (!reply.ok) return simklFailure(reply.failure)
      const token = asObject(reply.body).access_token
      if (typeof token !== "string" || token.length === 0 || token.length > 512)
        return success({ connected: false })
      await store.save(userId, token)
      return success({ connected: true })
    },

    sync: (userId) => syncUser(deps, userId),

    async disconnect(userId) {
      await store.remove(userId)
      return success({ connected: false as const })
    },
  }
}
