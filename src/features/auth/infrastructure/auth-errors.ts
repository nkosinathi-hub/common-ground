import { appError, err, ok, type AppError, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import type { QueryError } from "@/shared/infrastructure/query"

const TOO_MANY_REQUESTS = 429
const SERVER_ERROR = 500

/** Server trouble is not a wrong password: 5xx, 429, timeouts and network failures ask to retry. */
export const isOutage = ({ status, code }: QueryError) =>
  !status || status >= SERVER_ERROR || status === TOO_MANY_REQUESTS || code === "request_timeout"

/** An outage as the AppError its status means (network, or rate_limited for a 429). */
export const outage = (error: QueryError) => toAppError({ status: error.status ?? 0 })

/** Supabase Auth codes with copy a person can act on. */
const BY_CODE: Record<string, AppError> = {
  weak_password: appError("validation", "Choose a stronger password", "password"),
  same_password: appError("validation", "Choose a password you have not used here", "password"),
  over_email_send_rate_limit: appError(
    "rate_limited",
    "Too many emails sent. Wait a minute, then try again",
  ),
}

/** Awaits an auth call whose data is not needed, wording the codes above. */
export async function settleAuth(
  call: PromiseLike<{ readonly error: QueryError | null }>,
): Promise<Result<void>> {
  const { error } = await call
  if (!error) return ok(undefined)
  return err(BY_CODE[error.code ?? ""] ?? toAppError(error))
}
