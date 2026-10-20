import { failureWith } from "../http/outcome.ts"
import type { SimklFailure } from "./simkl-client.ts"

export const failure = failureWith({
  validation: "Invalid request",
  unauthenticated: "Sign in to connect Simkl",
  denied: "Simkl no longer accepts this connection. Connect again",
  not_found: "Connect Simkl first",
  rate_limited: "Simkl is busy. Give it a minute, then try again",
  unavailable: "Simkl is unavailable right now. Try again later",
})

export const NOT_CONFIGURED = "Simkl import is not set up on this server yet"

/** The answer for a failed Simkl call; a refused token is handled by the caller. */
export const simklFailure = (reason: SimklFailure) =>
  reason === "rate_limited" ? failure("rate_limited") : failure("unavailable")
