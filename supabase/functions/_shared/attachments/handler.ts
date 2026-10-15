import type { Gate } from "../http/gate.ts"
import { success, type Outcome } from "../http/outcome.ts"
import { bearerToken } from "../http/request.ts"
import { serveJson } from "../http/serve.ts"
import { runCleanup } from "./cleanup.ts"
import { failure } from "./outcome.ts"
import type { AttachmentsStore, ObjectStorage } from "./ports.ts"
import { CLEANUP_HEADER, isCleanupAuthorized } from "./secret.ts"
import { createAttachmentsService, type Caller } from "./service.ts"
import { isCleanupRequest, parseRequest, type AttachmentsRequest } from "./validate.ts"

export interface HandlerDeps {
  readonly allowedOrigins: readonly string[]
  readonly cleanupSecret: string
  readonly gate: Gate
  readonly store: AttachmentsStore
  readonly storage: ObjectStorage
}

type UserRequest = Exclude<AttachmentsRequest, { action: "cleanup" }>

/**
 * The function is deployed with verify_jwt = false so the scheduled cleanup can call it with
 * only its secret. Every user action therefore verifies the caller JWT here, and needs an
 * allowed Origin; cleanup needs the secret and nothing else.
 */
export function createAttachmentsHandler(deps: HandlerDeps) {
  const service = createAttachmentsService(deps)

  const dispatch = (caller: Caller, body: UserRequest): Promise<Outcome<unknown>> => {
    if (body.action === "start") return service.start(caller, body)
    if (body.action === "finalize") return service.finalize(caller, body.attachmentId)
    return service.download(caller, body.attachmentId, body.disposition)
  }

  async function cleanup(request: Request): Promise<Outcome<unknown>> {
    if (!isCleanupAuthorized(request.headers.get(CLEANUP_HEADER), deps.cleanupSecret))
      return failure("denied", "Not allowed")
    return success(await runCleanup(deps.store, deps.storage))
  }

  async function handle(raw: unknown, request: Request): Promise<Outcome<unknown>> {
    if (isCleanupRequest(raw)) return cleanup(request)
    const token = bearerToken(request.headers.get("authorization"))
    const userId = token ? await deps.gate.userFor(token) : null
    if (!token || !userId) return failure("unauthenticated")
    const parsed = parseRequest(raw)
    if (!parsed.ok) return failure("validation", parsed.message)
    return dispatch({ token, userId }, parsed.value as UserRequest)
  }

  return serveJson({
    allowedOrigins: deps.allowedOrigins,
    failure,
    withoutOrigin: isCleanupRequest,
    handle,
  })
}
