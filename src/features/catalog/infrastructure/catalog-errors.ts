import type { FunctionCopy } from "@/shared/infrastructure/functions"

export const OUTAGE_MESSAGE =
  "The catalog is unavailable right now. Your search is kept: try again, or add the title manually."

/** The catalog function's failures; only validation reasons are its own user copy. */
export const CATALOG_COPY: FunctionCopy = {
  outage: OUTAGE_MESSAGE,
  copy: {
    unauthenticated: "Please sign in again",
    denied: "You do not have access to this space",
    not_found: "This catalog title could not be found",
    rate_limited: "The catalog is busy. Give it a minute, then try again",
  },
  ownCopy: ["validation"],
}
