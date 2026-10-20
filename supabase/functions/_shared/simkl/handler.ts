import type { Gate, RateLimit } from "../http/gate.ts"
import type { Outcome } from "../http/outcome.ts"
import { bearerToken } from "../http/request.ts"
import { serveJson } from "../http/serve.ts"
import { NOT_CONFIGURED, failure } from "./outcome.ts"
import type { SimklService } from "./service.ts"

export interface SimklHandlerDeps {
  readonly allowedOrigins: readonly string[]
  readonly gate: Gate
  /** SIMKL_CLIENT_ID; while it is empty every action answers "not set up". */
  readonly clientId: string
  readonly service: SimklService
}

/** A device poll every 5 seconds fits, with room for a sync and a retry. */
export const RATE_LIMIT: RateLimit = { bucket: "simkl", max: 20, windowSeconds: 60 }

type SimklRequest =
  | { readonly action: "pin" | "sync" | "disconnect" }
  | { readonly action: "poll"; readonly interval: number }

const MAX_INTERVAL = 120

function parse(raw: unknown): SimklRequest | null {
  const body = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>
  const { action, interval = 5 } = body
  if (action === "pin" || action === "sync" || action === "disconnect") return { action }
  const valid = typeof interval === "number" && Number.isInteger(interval)
  if (action === "poll" && valid && interval > 0 && interval <= MAX_INTERVAL)
    return { action, interval }
  return null
}

function dispatch(service: SimklService, userId: string, request: SimklRequest) {
  if (request.action === "pin") return service.pin(userId)
  if (request.action === "poll") return service.poll(userId, request.interval)
  if (request.action === "sync") return service.sync(userId)
  return service.disconnect(userId)
}

/** Browser-only, for the signed-in user's own link: an allowed Origin and a JWT on every call. */
export function createSimklHandler({ allowedOrigins, gate, clientId, service }: SimklHandlerDeps) {
  async function handle(body: unknown, request: Request): Promise<Outcome<unknown>> {
    if (!clientId) return failure("unavailable", NOT_CONFIGURED)
    const token = bearerToken(request.headers.get("authorization"))
    const userId = token ? await gate.userFor(token) : null
    if (!userId) return failure("unauthenticated")
    const parsed = parse(body)
    if (!parsed) return failure("validation", "Unknown Simkl action")
    if (!(await gate.consume(userId, RATE_LIMIT))) return failure("rate_limited")
    return dispatch(service, userId, parsed)
  }

  return serveJson({ allowedOrigins, failure, handle })
}
