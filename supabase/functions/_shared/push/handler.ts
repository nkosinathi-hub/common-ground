import { failureWith, success, type Outcome } from "../http/outcome.ts"
import { isUuid } from "../http/request.ts"
import { isSecretAuthorized } from "../http/secret.ts"
import { serveJson } from "../http/serve.ts"
import type { Send } from "./fcm.ts"
import type { PushStore } from "./ports.ts"
import { deliver } from "./service.ts"

const PUSH_HEADER = "x-push-secret"

const failure = failureWith({
  validation: "Invalid request",
  unauthenticated: "Not allowed",
  denied: "Not allowed",
  not_found: "Not found",
  rate_limited: "Try again later",
  unavailable: "Push is unavailable",
})

export interface PushHandlerDeps {
  readonly pushSecret: string
  readonly store: PushStore
  /** Null while FCM_SERVICE_ACCOUNT is missing or unusable. */
  readonly send: Send | null
}

const notificationIdOf = (body: unknown): string | null => {
  const id = (body as { notificationId?: unknown } | null)?.notificationId
  return isUuid(id) ? id : null
}

/**
 * Called only by the notifications trigger through pg_net (deployed with verify_jwt = false):
 * no browser origin is allowed, and every call needs the push secret.
 */
export function createPushHandler(deps: PushHandlerDeps) {
  async function handle(body: unknown, request: Request): Promise<Outcome<unknown>> {
    if (!isSecretAuthorized(request.headers.get(PUSH_HEADER), deps.pushSecret))
      return failure("denied")
    const notificationId = notificationIdOf(body)
    if (!notificationId) return failure("validation")
    if (!deps.send) return failure("unavailable")
    return success(await deliver(deps.store, deps.send, notificationId))
  }

  return serveJson({ allowedOrigins: [], failure, withoutOrigin: () => true, handle })
}
