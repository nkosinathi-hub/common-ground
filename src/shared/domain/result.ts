export type AppErrorKind =
  | "validation"
  | "denied"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "network"
  | "unauthenticated"
  | "unknown"

export interface AppError {
  readonly kind: AppErrorKind
  readonly message: string
  readonly field?: string
}

export type Ok<T> = { readonly ok: true; readonly value: T }
export type Err<E = AppError> = { readonly ok: false; readonly error: E }
export type Result<T, E = AppError> = Ok<T> | Err<E>

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value })
export const err = <E = AppError>(error: E): Err<E> => ({ ok: false, error })
export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok

export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result
}

export const appError = (kind: AppErrorKind, message: string, field?: string): AppError =>
  field === undefined ? { kind, message } : { kind, message, field }
