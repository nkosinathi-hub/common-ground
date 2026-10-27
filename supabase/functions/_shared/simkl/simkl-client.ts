// The Simkl API (https://api.simkl.org/): AUTH V2 device flow, tokens, and the history reads.
// The client id is public by Simkl's design; tokens and device codes are sent only to Simkl
// in form bodies or the Authorization header, never in a URL, and never logged.

import { errorOf, failureFor, readBody, type SimklFailure } from "./simkl-reply.ts"

export type { SimklFailure }

export type SimklResult =
  { ok: true; body: unknown } | { ok: false; failure: SimklFailure; error: string | null }
export type ItemKind = "shows" | "movies"

export interface SimklClient {
  startDevice(): Promise<SimklResult>
  /** POST /oauth2/token with one grant's fields; the client id is added. */
  token(grant: Record<string, string>): Promise<SimklResult>
  revoke(token: string): Promise<SimklResult>
  activities(accessToken: string): Promise<SimklResult>
  allItems(accessToken: string, kind: ItemKind, dateFrom: string | null): Promise<SimklResult>
}

interface SimklConfig {
  readonly clientId: string
  /** The platform fetch, injected by the Deno entry so tests never reach the network. */
  readonly fetch: (url: string, init?: RequestInit) => Promise<Response>
  readonly baseUrl?: string
  readonly timeoutMs?: number
}

export const DEFAULT_SIMKL_BASE_URL = "https://api.simkl.com"
/** Kept equal to package.json's version by simkl-client.test.ts. */
export const APP = { name: "common-ground", version: "0.5.4" }
const SIMKL_TIMEOUT_MS = 20_000

export function createSimklClient(config: SimklConfig): SimklClient {
  const base = (config.baseUrl || DEFAULT_SIMKL_BASE_URL).replace(/\/+$/, "")
  const timeoutMs = config.timeoutMs ?? SIMKL_TIMEOUT_MS

  async function send(
    method: string,
    path: string,
    init: { query?: Record<string, string>; form?: Record<string, string>; token?: string },
  ): Promise<SimklResult> {
    const url = new URL(`${base}${path}`)
    const params = { client_id: config.clientId, "app-name": APP.name, "app-version": APP.version }
    for (const [key, value] of Object.entries({ ...params, ...init.query }))
      url.searchParams.set(key, value)
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": `${APP.name}/${APP.version}`,
    }
    if (init.form) headers["Content-Type"] = "application/x-www-form-urlencoded"
    if (init.token) headers.Authorization = `Bearer ${init.token}`
    const body = init.form ? new URLSearchParams(init.form).toString() : undefined
    try {
      const signal = AbortSignal.timeout(timeoutMs)
      const response = await config.fetch(url.toString(), { method, headers, body, signal })
      const parsed = await readBody(response)
      if (!response.ok)
        return { ok: false, failure: failureFor(response.status), error: errorOf(parsed) }
      if (parsed === undefined) return { ok: false, failure: "unavailable", error: null }
      return { ok: true, body: parsed }
    } catch {
      return { ok: false, failure: "unavailable", error: null }
    }
  }

  const form = (path: string, fields: Record<string, string>) =>
    send("POST", path, { form: { client_id: config.clientId, ...fields } })

  return {
    startDevice: () => form("/oauth2/device", { scope: "media:read" }),
    token: (grant) => form("/oauth2/token", grant),
    revoke: (token) => form("/oauth2/revoke", { token }),
    activities: (token) => send("GET", "/sync/activities", { token }),
    allItems: (token, kind, dateFrom) =>
      send("GET", `/sync/all-items/${kind}`, {
        token,
        query: {
          extended: "full",
          episode_watched_at: "yes",
          ...(dateFrom ? { date_from: dateFrom } : {}),
        },
      }),
  }
}
