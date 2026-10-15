import type { CatalogErrorKind } from "./types.ts"

export type Failure = {
  readonly ok: false
  readonly kind: CatalogErrorKind
  readonly status: number
  readonly message: string
}
export type Outcome<T> = { readonly ok: true; readonly body: T } | Failure

export const STATUS: Record<CatalogErrorKind, number> = {
  validation: 400,
  unauthenticated: 401,
  denied: 403,
  not_found: 404,
  rate_limited: 429,
  unavailable: 503,
}

const COPY: Record<CatalogErrorKind, string> = {
  validation: "Invalid request",
  unauthenticated: "Sign in to search the catalog",
  denied: "This space is unavailable",
  not_found: "This catalog title could not be found",
  rate_limited: "The catalog is busy. Give it a minute, then try again",
  unavailable: "The catalog is unavailable right now. Try again, or add the title manually",
}

export const failure = (kind: CatalogErrorKind, message = COPY[kind]): Failure => ({
  ok: false,
  kind,
  status: STATUS[kind],
  message,
})
