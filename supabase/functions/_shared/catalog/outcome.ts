import { failureWith } from "../http/outcome.ts"
import type { TmdbFailure } from "./tmdb-client.ts"

export const failure = failureWith({
  validation: "Invalid request",
  unauthenticated: "Sign in to search the catalog",
  denied: "This space is unavailable",
  not_found: "This catalog title could not be found",
  rate_limited: "The catalog is busy. Give it a minute, then try again",
  unavailable: "The catalog is unavailable right now. Try again, or add the title manually",
})

const FAILURE_KIND = { rate_limited: "rate_limited", not_found: "not_found" } as const

/** The catalog failure a TMDB failure becomes; anything unexpected reads as unavailable. */
export const kindFor = (reason: TmdbFailure) =>
  reason in FAILURE_KIND ? FAILURE_KIND[reason as keyof typeof FAILURE_KIND] : "unavailable"
