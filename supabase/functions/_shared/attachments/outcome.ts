import type { AttachmentsErrorKind } from "./types.ts"

export type Failure = {
  readonly ok: false
  readonly kind: AttachmentsErrorKind
  readonly status: number
  readonly message: string
}
export type Outcome<T> = { readonly ok: true; readonly body: T } | Failure

const STATUS: Record<AttachmentsErrorKind, number> = {
  validation: 400,
  unauthenticated: 401,
  denied: 403,
  not_found: 404,
  rate_limited: 429,
  unavailable: 503,
}

const COPY: Record<AttachmentsErrorKind, string> = {
  validation: "Invalid request",
  unauthenticated: "Sign in to use attachments",
  denied: "You do not have access to this file",
  not_found: "This file could not be found",
  rate_limited: "A little pause: you can upload 20 files per hour",
  unavailable: "Attachments are unavailable right now. Try again in a moment",
}

export const failure = (kind: AttachmentsErrorKind, message = COPY[kind]): Failure => ({
  ok: false,
  kind,
  status: STATUS[kind],
  message,
})

export const success = <T>(body: T): Outcome<T> => ({ ok: true, body })
