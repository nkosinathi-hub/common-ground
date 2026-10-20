import { appError, err, ok, type Result } from "../../../../shared/domain/result"
import type { Credential, PluginDeps } from "../../domain/plugin.types"
import { requestJson, requestOk } from "../http"

export const TICKS_PER_SECOND = 10_000_000
const VERSION = "0.5.0"

/** Jellyfin 12's only auth: the MediaBrowser Authorization header, never a query parameter. */
export function authorization(deviceId: string, token?: string): string {
  const base = `MediaBrowser Client="Common Ground", Device="Web", DeviceId="${deviceId}", Version="${VERSION}"`
  return token ? `${base}, Token="${token}"` : base
}

/** Removes any credential Jellyfin echoes into a URL (TranscodingUrl, DeliveryUrl). */
export function withoutToken(url: string): string {
  const parsed = new URL(url)
  for (const key of [...parsed.searchParams.keys()]) {
    if (/^(api_?key|access_?token)$/i.test(key)) parsed.searchParams.delete(key)
  }
  return parsed.href
}

export interface Query {
  readonly [key: string]: string | number | boolean | undefined
}

/** One signed-in user's calls to their server. */
export class JellyfinSession {
  constructor(
    readonly origin: string,
    private readonly fetcher: typeof fetch,
    readonly credential: Credential,
  ) {}

  get headers(): Record<string, string> {
    return { Authorization: authorization(this.credential.deviceId, this.credential.token) }
  }

  url(path: string, query: Query = {}): string {
    const url = new URL(path, this.origin)
    for (const [key, value] of Object.entries(query))
      if (value !== undefined) url.searchParams.set(key, String(value))
    return url.href
  }

  get(path: string, query: Query, signal?: AbortSignal): Promise<Result<unknown>> {
    const url = this.url(path, query)
    return requestJson(this.fetcher, { url, headers: this.headers, ...(signal ? { signal } : {}) })
  }

  post(path: string, body: unknown, more: { signal?: AbortSignal; keepalive?: boolean } = {}) {
    const request = { url: this.url(path), method: "POST" as const, headers: this.headers, body }
    return requestJson(this.fetcher, { ...request, ...more })
  }

  send(path: string, body: unknown, keepalive: boolean): Promise<Result<void>> {
    const request = { url: this.url(path), method: "POST" as const, headers: this.headers, body }
    return requestOk(this.fetcher, { ...request, keepalive })
  }
}

export async function openSession(deps: PluginDeps, origin: string) {
  const credential = await deps.credentials.get(deps.id)
  if (!credential) return err(appError("unauthenticated", "Sign in to Jellyfin to play from it"))
  return ok(new JellyfinSession(origin, deps.fetch, credential))
}
