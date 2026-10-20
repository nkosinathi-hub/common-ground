// The Simkl API (https://api.simkl.org/): PIN sign-in and the history sync reads. The client id
// is public by Simkl's design; the user's token is sent only to Simkl and never logged.

/** unauthorized = Simkl refused the token (revoked); the link must be made again. */
export type SimklFailure = "unauthorized" | "rate_limited" | "unavailable"
export type SimklResult = { ok: true; body: unknown } | { ok: false; failure: SimklFailure }
export type ItemKind = "shows" | "movies"

export interface SimklClient {
  startPin(): Promise<SimklResult>
  pollPin(userCode: string): Promise<SimklResult>
  activities(token: string): Promise<SimklResult>
  allItems(token: string, kind: ItemKind, dateFrom: string | null): Promise<SimklResult>
}

interface SimklConfig {
  readonly clientId: string
  /** The platform fetch, injected by the Deno entry so tests never reach the network. */
  readonly fetch: (url: string, init?: RequestInit) => Promise<Response>
  readonly baseUrl?: string
  readonly timeoutMs?: number
}

export const DEFAULT_SIMKL_BASE_URL = "https://api.simkl.com"
const APP = { name: "common-ground", version: "0.5.0" }
const SIMKL_TIMEOUT_MS = 20_000

function failureFor(status: number): SimklFailure {
  if (status === 401 || status === 403) return "unauthorized"
  if (status === 429) return "rate_limited"
  return "unavailable"
}

export function createSimklClient(config: SimklConfig): SimklClient {
  const base = (config.baseUrl || DEFAULT_SIMKL_BASE_URL).replace(/\/+$/, "")
  const timeoutMs = config.timeoutMs ?? SIMKL_TIMEOUT_MS

  async function get(path: string, token: string | null, query: Record<string, string> = {}) {
    const url = new URL(`${base}${path}`)
    const params = { client_id: config.clientId, "app-name": APP.name, "app-version": APP.version }
    for (const [key, value] of Object.entries({ ...params, ...query }))
      url.searchParams.set(key, value)
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": `${APP.name}/${APP.version}`,
      "simkl-api-key": config.clientId,
    }
    if (token) headers.Authorization = `Bearer ${token}`
    try {
      const response = await config.fetch(url.toString(), {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!response.ok) return { ok: false, failure: failureFor(response.status) } as const
      return { ok: true, body: (await response.json()) as unknown } as const
    } catch {
      return { ok: false, failure: "unavailable" } as const
    }
  }

  return {
    startPin: () => get("/oauth/pin", null),
    pollPin: (userCode) => get(`/oauth/pin/${encodeURIComponent(userCode)}`, null),
    activities: (token) => get("/sync/activities", token),
    allItems: (token, kind, dateFrom) =>
      get(`/sync/all-items/${kind}`, token, {
        extended: "full",
        episode_watched_at: "yes",
        ...(dateFrom ? { date_from: dateFrom } : {}),
      }),
  }
}
