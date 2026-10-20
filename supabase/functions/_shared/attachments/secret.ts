import { isSecretAuthorized } from "../http/secret.ts"

export const CLEANUP_HEADER = "x-cleanup-secret"

/** The cleanup action runs only with the configured secret; a short or unset secret denies all. */
export const isCleanupAuthorized = isSecretAuthorized
