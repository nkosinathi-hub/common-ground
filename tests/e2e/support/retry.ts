const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Transient: the local stack timed out, rate limited or failed with 5xx; anything else is real. */
export function isRetryable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const { name, status } = error as { name?: string; status?: number }
  return name === "AuthRetryableFetchError" || status === 429 || (status ?? 0) >= 500
}

/** Runs an admin call up to three times with backoff (1s, 2s) when the stack is overloaded. */
export async function withRetry<T>(
  run: () => Promise<T>,
  wait: (ms: number) => Promise<void> = pause,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run()
    } catch (error) {
      if (attempt >= 3 || !isRetryable(error)) throw error
      await wait(1000 * attempt)
    }
  }
}
