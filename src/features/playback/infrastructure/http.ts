import { appError, err, ok, type AppError, type Result } from "../../../shared/domain/result"

export interface HttpRequest {
  readonly url: string
  readonly method?: "GET" | "POST"
  readonly headers?: Readonly<Record<string, string>>
  readonly body?: unknown
  readonly keepalive?: boolean
  readonly signal?: AbortSignal
}

/** HTTP status to AppError kind, so plugins classify failures the same way. */
export function statusError(status: number): AppError {
  const message = `The provider answered ${status}`
  if (status === 401) return appError("unauthenticated", message)
  if (status === 403) return appError("denied", message)
  if (status === 404) return appError("not_found", message)
  if (status === 429) return appError("rate_limited", message)
  if (status >= 500) return appError("network", message)
  return appError("validation", message)
}

async function send(fetcher: typeof fetch, request: HttpRequest): Promise<Result<Response>> {
  const json: Record<string, string> =
    request.body === undefined ? {} : { "Content-Type": "application/json" }
  try {
    const response = await fetcher(request.url, {
      method: request.method ?? "GET",
      headers: { Accept: "application/json", ...json, ...request.headers },
      ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
      ...(request.keepalive ? { keepalive: true } : {}),
      ...(request.signal ? { signal: request.signal } : {}),
    })
    return response.ok ? ok(response) : err(statusError(response.status))
  } catch {
    return err(appError("network", "The provider could not be reached"))
  }
}

export async function requestJson(
  fetcher: typeof fetch,
  request: HttpRequest,
): Promise<Result<unknown>> {
  const response = await send(fetcher, request)
  if (!response.ok) return response
  try {
    return ok(await response.value.json())
  } catch {
    return err(appError("unknown", "The provider sent something that is not JSON"))
  }
}

export async function requestOk(
  fetcher: typeof fetch,
  request: HttpRequest,
): Promise<Result<void>> {
  const response = await send(fetcher, request)
  return response.ok ? ok(undefined) : response
}
