import type { FunctionCopy } from "@/shared/infrastructure/functions"

/**
 * The attachments function's failures. Validation and rate-limit messages are the function's
 * own user copy, so they pass through.
 */
export const ATTACHMENTS_COPY: FunctionCopy = {
  outage: "Attachments are unavailable right now. Try again in a moment",
  copy: {
    unauthenticated: "Please sign in again",
    denied: "You do not have access to this file",
    not_found: "This file could not be found",
  },
  ownCopy: ["validation", "rate_limited"],
}
