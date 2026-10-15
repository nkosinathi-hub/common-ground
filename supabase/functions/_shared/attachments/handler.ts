import { bearerToken, corsHeaders, isOriginAllowed, jsonResponse } from "../catalog/http.ts"
import { runCleanup } from "./cleanup.ts"
import { failure, success, type Outcome } from "./outcome.ts"
import type { AttachmentsGate, AttachmentsStore, ObjectStorage } from "./ports.ts"
import { CLEANUP_HEADER, isCleanupAuthorized } from "./secret.ts"
import { createAttachmentsService, type Caller } from "./service.ts"
import { parseRequest, type AttachmentsRequest } from "./validate.ts"

export interface HandlerDeps {
  readonly allowedOrigins: readonly string[]
  readonly cleanupSecret: string
  readonly gate: AttachmentsGate
  readonly store: AttachmentsStore
  readonly storage: ObjectStorage
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

type Authed = Exclude<AttachmentsRequest, { action: "cleanup" }>

export function createAttachmentsHandler(deps: HandlerDeps) {
  const service = createAttachmentsService(deps)

  const dispatch = (caller: Caller, body: Authed): Promise<Outcome<unknown>> => {
    if (body.action === "start") return service.start(caller, body)
    if (body.action === "finalize") return service.finalize(caller, body.attachmentId)
    return service.download(caller, body.attachmentId, body.disposition)
  }

  async function handle(request: Request): Promise<Outcome<unknown>> {
    const parsed = parseRequest(await readJson(request))
    if (parsed.ok && parsed.value.action === "cleanup") {
      if (!isCleanupAuthorized(request.headers.get(CLEANUP_HEADER), deps.cleanupSecret))
        return failure("denied", "Not allowed")
      return success(await runCleanup(deps.store, deps.storage))
    }
    const token = bearerToken(request.headers.get("authorization"))
    const userId = token ? await deps.gate.userFor(token) : null
    if (!token || !userId) return failure("unauthenticated")
    if (!parsed.ok) return failure("validation", parsed.message)
    return dispatch({ token, userId }, parsed.value as Authed)
  }

  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin")
    const cors = corsHeaders(origin, deps.allowedOrigins)
    const reply = (outcome: Outcome<unknown>) =>
      outcome.ok
        ? jsonResponse(200, outcome.body, cors)
        : jsonResponse(
            outcome.status,
            { error: { kind: outcome.kind, message: outcome.message } },
            cors,
          )
    if (!isOriginAllowed(origin, deps.allowedOrigins))
      return reply(failure("denied", "Origin not allowed"))
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors })
    if (request.method !== "POST") return reply(failure("validation", "Use POST"))
    try {
      return reply(await handle(request))
    } catch {
      return reply(failure("unavailable"))
    }
  }
}
