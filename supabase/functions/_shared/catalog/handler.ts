import { bearerToken, corsHeaders, isOriginAllowed, jsonResponse } from "./http.ts"
import { failure, type Outcome } from "./outcome.ts"
import type { CatalogService } from "./service.ts"
import { parseRequest, type CatalogRequest } from "./validate.ts"

export const RATE_LIMIT = { bucket: "catalog", max: 30, windowSeconds: 60 } as const

/** Checks that talk to Supabase; the Edge Function entry implements them. */
export interface Gatekeeper {
  /** Verifies the caller JWT and returns its user id, or null. */
  userFor(token: string): Promise<string | null>
  /** Calls public.is_space_member as the caller, so RLS-equivalent rules decide. */
  isMember(token: string, spaceId: string): Promise<boolean>
  /** Consumes one request from the caller's shared rate-limit bucket. */
  consume(userId: string): Promise<boolean>
}

export interface HandlerDeps {
  readonly allowedOrigins: readonly string[]
  readonly gate: Gatekeeper
  readonly service: CatalogService
}

function dispatch(service: CatalogService, request: CatalogRequest): Promise<Outcome<unknown>> {
  if (request.action === "search") return service.search(request.query, request.page)
  if (request.action === "refresh") return service.refresh(request.type, request.id)
  return service.details(request.type, request.id)
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

async function authorize(request: Request, gate: Gatekeeper): Promise<Outcome<CatalogRequest>> {
  const token = bearerToken(request.headers.get("authorization"))
  const userId = token ? await gate.userFor(token) : null
  if (!token || !userId) return failure("unauthenticated")
  const parsed = parseRequest(await readJson(request))
  if (!parsed.ok) return failure("validation", parsed.message)
  if (!(await gate.isMember(token, parsed.value.spaceId))) return failure("denied")
  if (!(await gate.consume(userId)))
    return failure("rate_limited", "A little pause: you can make 30 catalog requests per minute")
  return { ok: true, body: parsed.value }
}

export function createCatalogHandler({ allowedOrigins, gate, service }: HandlerDeps) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin")
    const cors = corsHeaders(origin, allowedOrigins)
    const reply = (outcome: Outcome<unknown>) =>
      outcome.ok
        ? jsonResponse(200, outcome.body, cors)
        : jsonResponse(
            outcome.status,
            { error: { kind: outcome.kind, message: outcome.message } },
            cors,
          )
    if (!isOriginAllowed(origin, allowedOrigins))
      return reply(failure("denied", "Origin not allowed"))
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors })
    if (request.method !== "POST") return reply(failure("validation", "Use POST"))
    try {
      const allowed = await authorize(request, gate)
      return reply(allowed.ok ? await dispatch(service, allowed.body) : allowed)
    } catch {
      return reply(failure("unavailable"))
    }
  }
}
