export const DEFAULT_TMDB_BASE_URL = "https://api.themoviedb.org/3"
export const TMDB_TIMEOUT_MS = 12_000

/** outage = TMDB 5xx, timeout or network failure; these may be answered from stale cache. */
export type TmdbFailure = "rate_limited" | "not_found" | "outage" | "unavailable"
export type TmdbResult = { ok: true; body: unknown } | { ok: false; failure: TmdbFailure }

export interface TmdbClient {
  get(path: string): Promise<TmdbResult>
}

export interface TmdbConfig {
  readonly token: string
  readonly baseUrl?: string
  readonly timeoutMs?: number
  readonly fetch?: (url: string, init?: RequestInit) => Promise<Response>
}

function failureFor(status: number): TmdbFailure {
  if (status === 429) return "rate_limited"
  if (status === 404) return "not_found"
  if (status >= 500) return "outage"
  return "unavailable"
}

export function createTmdbClient(config: TmdbConfig): TmdbClient {
  const base = (config.baseUrl || DEFAULT_TMDB_BASE_URL).replace(/\/+$/, "")
  const send = config.fetch ?? ((url: string, init?: RequestInit) => fetch(url, init))
  const timeoutMs = config.timeoutMs ?? TMDB_TIMEOUT_MS
  return {
    async get(path) {
      if (!config.token) return { ok: false, failure: "unavailable" }
      let response: Response
      try {
        response = await send(`${base}/${path.replace(/^\/+/, "")}`, {
          headers: { Authorization: `Bearer ${config.token}`, Accept: "application/json" },
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch {
        return { ok: false, failure: "outage" }
      }
      if (!response.ok) return { ok: false, failure: failureFor(response.status) }
      try {
        return { ok: true, body: await response.json() }
      } catch {
        return { ok: false, failure: "outage" }
      }
    },
  }
}
