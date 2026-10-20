import type { Gate, RateLimit } from "../http/gate.ts"
import type { Outcome } from "../http/outcome.ts"
import { bearerToken } from "../http/request.ts"
import { serveJson } from "../http/serve.ts"
import { failure } from "./outcome.ts"
import type { CatalogService } from "./service.ts"
import { parseRequest, type CatalogRequest } from "./validate.ts"

export interface HandlerDeps {
  readonly allowedOrigins: readonly string[]
  readonly gate: Gate
  readonly service: CatalogService
}

export const RATE_LIMIT: RateLimit = { bucket: "catalog", max: 30, windowSeconds: 60 }
const BUSY = `A little pause: you can make ${RATE_LIMIT.max} catalog requests per minute`

function dispatch(service: CatalogService, request: CatalogRequest): Promise<Outcome<unknown>> {
  if (request.action === "search") return service.search(request.query, request.page)
  if (request.action === "refresh") return service.refresh(request.type, request.id)
  if (request.action === "season") return service.season(request.id, request.season)
  return service.details(request.type, request.id)
}

async function authorize(
  body: unknown,
  request: Request,
  gate: Gate,
): Promise<Outcome<CatalogRequest>> {
  const token = bearerToken(request.headers.get("authorization"))
  const userId = token ? await gate.userFor(token) : null
  if (!token || !userId) return failure("unauthenticated")
  const parsed = parseRequest(body)
  if (!parsed.ok) return failure("validation", parsed.message)
  if (!(await gate.isMember(token, parsed.value.spaceId))) return failure("denied")
  if (!(await gate.consume(userId, RATE_LIMIT))) return failure("rate_limited", BUSY)
  return { ok: true, body: parsed.value }
}

/** Browser-only: every catalog request needs an allowed Origin and a member's JWT. */
export function createCatalogHandler({ allowedOrigins, gate, service }: HandlerDeps) {
  return serveJson({
    allowedOrigins,
    failure,
    handle: async (body, request) => {
      const allowed = await authorize(body, request, gate)
      return allowed.ok ? dispatch(service, allowed.body) : allowed
    },
  })
}
