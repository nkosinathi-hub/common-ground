/** Error kinds every Edge Function answers with; the SPA maps them to AppError kinds. */
export type ErrorKind =
  "validation" | "unauthenticated" | "denied" | "not_found" | "rate_limited" | "unavailable"

interface Failure {
  readonly ok: false
  readonly kind: ErrorKind
  readonly status: number
  readonly message: string
}

export type Outcome<T> = { readonly ok: true; readonly body: T } | Failure

/** The default user copy of one function, per kind. */
export type FailureCopy = Readonly<Record<ErrorKind, string>>

export type FailureOf = (kind: ErrorKind, message?: string) => Failure

const STATUS: Record<ErrorKind, number> = {
  validation: 400,
  unauthenticated: 401,
  denied: 403,
  not_found: 404,
  rate_limited: 429,
  unavailable: 503,
}

/** Builds failures with the HTTP status of their kind and the function's own default copy. */
export const failureWith =
  (copy: FailureCopy): FailureOf =>
  (kind, message = copy[kind]) => ({ ok: false, kind, status: STATUS[kind], message })

export const success = <T>(body: T): Outcome<T> => ({ ok: true, body })
