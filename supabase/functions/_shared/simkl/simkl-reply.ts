// How a Simkl reply reads: the failure its status means, and its OAuth `error` field.
/**
 * unauthorized = 401/403 (a refused token, or invalid_client on the OAuth endpoints);
 * rejected = 400, whose OAuth `error` says why (authorization_pending, slow_down, ...).
 */
export type SimklFailure = "unauthorized" | "rejected" | "rate_limited" | "unavailable"

export function failureFor(status: number): SimklFailure {
  if (status === 401 || status === 403) return "unauthorized"
  if (status === 429) return "rate_limited"
  if (status === 400) return "rejected"
  return "unavailable"
}

export const errorOf = (body: unknown): string | null => {
  const error = (body as { error?: unknown } | null)?.error
  return typeof error === "string" ? error : null
}

export async function readBody(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown
  } catch {
    return undefined
  }
}
