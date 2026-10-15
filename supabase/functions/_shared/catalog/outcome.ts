import { failureWith } from "../http/outcome.ts"

export const failure = failureWith({
  validation: "Invalid request",
  unauthenticated: "Sign in to search the catalog",
  denied: "This space is unavailable",
  not_found: "This catalog title could not be found",
  rate_limited: "The catalog is busy. Give it a minute, then try again",
  unavailable: "The catalog is unavailable right now. Try again, or add the title manually",
})
