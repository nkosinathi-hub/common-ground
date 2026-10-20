// Test helper: a stub Simkl API behind an injected fetch, at SIMKL_BASE_URL http://simkl.test.
// Replies are queued per "METHOD /path"; the last one repeats. Not deployed.

export const STUB_BASE_URL = "http://simkl.test"

interface Reply {
  readonly status: number
  readonly body: unknown
}

export interface StubRequest {
  readonly route: string
  readonly query: URLSearchParams
  readonly form: URLSearchParams | null
  readonly headers: Headers
}

export const DEVICE = {
  device_code: "device-secret-1",
  user_code: "ABCD-EFGH",
  verification_uri: "https://simkl.com/pin",
  verification_uri_complete: "https://simkl.com/pin?user_code=ABCD-EFGH",
  expires_in: 900,
  interval: 5,
}

export const tokenReply = (access = "simkl_at_new", refresh = "simkl_rt_one") => ({
  access_token: access,
  token_type: "Bearer",
  expires_in: 604800,
  refresh_token: refresh,
  scope: "media:read",
})

export class StubSimkl {
  readonly requests: StubRequest[] = []
  private readonly routes = new Map<string, Reply[]>([
    ["POST /oauth2/device", [{ status: 200, body: DEVICE }]],
    ["POST /oauth2/token", [{ status: 400, body: { error: "authorization_pending" } }]],
    ["POST /oauth2/revoke", [{ status: 200, body: {} }]],
    ["GET /sync/activities", [{ status: 200, body: { all: "2026-02-01T00:00:00Z" } }]],
    ["GET /sync/all-items/shows", [{ status: 200, body: null }]],
    ["GET /sync/all-items/movies", [{ status: 200, body: null }]],
  ])

  /** Replaces the replies for a route; they are given in turn, the last one repeating. */
  reply(route: string, ...replies: Reply[]): this {
    this.routes.set(route, replies)
    return this
  }

  sent(route: string): StubRequest[] {
    return this.requests.filter((request) => request.route === route)
  }

  fetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
    const parsed = new URL(url)
    const route = `${init.method ?? "GET"} ${parsed.pathname}`
    const form = typeof init.body === "string" ? new URLSearchParams(init.body) : null
    this.requests.push({
      route,
      query: parsed.searchParams,
      form,
      headers: new Headers(init.headers),
    })
    const queue = this.routes.get(route) ?? [{ status: 404, body: { error: "not_found" } }]
    const next = (queue.length > 1 ? queue.shift() : queue[0]) as Reply
    return new Response(JSON.stringify(next.body), { status: next.status })
  }
}
