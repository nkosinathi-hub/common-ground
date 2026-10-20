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

/** A PIN poll every 5 seconds fits, with room for a sync and a retry. */
export const RATE_LIMIT: RateLimit = { bucket: "simkl", max: 20, windowSeconds: 60 }

type SimklRequest =
  | { readonly action: "pin" | "sync" | "disconnect" }
  | { readonly action: "poll"; readonly userCode: string }

const USER_CODE = /^[A-Za-z0-9-]{4,16}$/

function parse(raw: unknown): SimklRequest | null {
  const body = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>
  const { action, userCode } = body
  if (action === "pin" || action === "sync" || action === "disconnect") return { action }
  if (action === "poll" && typeof userCode === "string" && USER_CODE.test(userCode))
    return { action, userCode }
  return null
}

function dispatch(service: SimklService, userId: string, request: SimklRequest) {
  if (request.action === "pin") return service.pin()
  if (request.action === "poll") return service.poll(userId, request.userCode)
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
