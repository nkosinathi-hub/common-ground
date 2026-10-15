import { corsHeaders, isOriginAllowed } from "./cors.ts"
import type { FailureOf, Outcome } from "./outcome.ts"
import { readJson } from "./request.ts"

interface ServeOptions {
  readonly allowedOrigins: readonly string[]
  /** The function's failure builder, so refusals carry its own copy. */
  readonly failure: FailureOf
  /**
   * Bodies a server-to-server caller may send without an Origin header. Such actions must
   * authenticate by other means (a secret); every other request needs an allowed Origin.
   */
  readonly withoutOrigin?: (body: unknown) => boolean
  readonly handle: (body: unknown, request: Request) => Promise<Outcome<unknown>>
}

export function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
    },
  })
}

const toResponse = (outcome: Outcome<unknown>, cors: Record<string, string>): Response =>
  outcome.ok
    ? jsonResponse(200, outcome.body, cors)
    : jsonResponse(
        outcome.status,
        { error: { kind: outcome.kind, message: outcome.message } },
        cors,
      )

/**
 * The shared POST-only JSON envelope: Origin allow list, preflight, method check, and a 503
 * that hides internal failures. Bodies are never logged.
 */
export function serveJson(options: ServeOptions) {
  const { allowedOrigins, failure, withoutOrigin, handle } = options
  const originDenied = failure("denied", "Origin not allowed")

  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin")
    const cors = corsHeaders(origin, allowedOrigins)
    const reply = (outcome: Outcome<unknown>) => toResponse(outcome, cors)
    const allowed = isOriginAllowed(origin, allowedOrigins)
    if (origin !== null && !allowed) return reply(originDenied)
    if (request.method === "OPTIONS")
      return allowed ? new Response(null, { status: 204, headers: cors }) : reply(originDenied)
    if (request.method !== "POST") return reply(failure("validation", "Use POST"))
    try {
      const body = await readJson(request)
      if (!allowed && !withoutOrigin?.(body)) return reply(originDenied)
      return reply(await handle(body, request))
    } catch {
      return reply(failure("unavailable"))
    }
  }
}
