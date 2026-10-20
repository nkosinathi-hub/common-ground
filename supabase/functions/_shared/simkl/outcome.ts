import { failureWith } from "../http/outcome.ts"
import type { SimklResult } from "./simkl-client.ts"

export const failure = failureWith({
  validation: "Invalid request",
  unauthenticated: "Sign in to connect Simkl",
  denied: "Simkl no longer accepts this connection. Connect again",
  not_found: "Connect Simkl first",
  rate_limited: "Simkl is busy. Give it a minute, then try again",
  unavailable: "Simkl is unavailable right now. Try again later",
})

/** Unset SIMKL_CLIENT_ID, or one Simkl answers with 401 invalid_client (unknown, or AUTH V1). */
export const NOT_CONFIGURED = "Simkl import is not set up on this server yet"

export const isInvalidClient = (reply: SimklResult) =>
  !reply.ok && reply.failure === "unauthorized" && reply.error === "invalid_client"

/** The answer for a failed Simkl call that has no meaning of its own to the caller. */
export function simklFailure(reply: SimklResult & { ok: false }) {
  if (isInvalidClient(reply)) return failure("unavailable", NOT_CONFIGURED)
  return reply.failure === "rate_limited" ? failure("rate_limited") : failure("unavailable")
}
