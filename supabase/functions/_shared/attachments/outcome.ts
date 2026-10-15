import { failureWith } from "../http/outcome.ts"

export const failure = failureWith({
  validation: "Invalid request",
  unauthenticated: "Sign in to use attachments",
  denied: "You do not have access to this file",
  not_found: "This file could not be found",
  rate_limited: "A little pause: try again in a minute",
  unavailable: "Attachments are unavailable right now. Try again in a moment",
})
