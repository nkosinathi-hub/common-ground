import { appError, err, type Result } from "../../../shared/domain/result"
import { timeoutError } from "../domain/errors"

export interface TimedOutcome<T> {
  readonly result: Result<T>
  readonly timedOut: boolean
}

/**
 * Runs a task with its own AbortSignal, aborted after `ms` or when the caller aborts. The answer
 * never waits on a task that ignores its signal.
 */
export async function withTimeout<T>(
  task: (signal: AbortSignal) => Promise<Result<T>>,
  ms: number,
  parent?: AbortSignal,
): Promise<TimedOutcome<T>> {
  const controller = new AbortController()
  let timedOut = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const stop = () => controller.abort()
  parent?.addEventListener("abort", stop, { once: true })
  if (parent?.aborted) controller.abort()
  const aborted = new Promise<Result<T>>((resolve) => {
    const settle = () =>
      resolve(err(timedOut ? timeoutError(ms) : appError("network", "Cancelled")))
    controller.signal.addEventListener("abort", settle, { once: true })
    if (controller.signal.aborted) settle()
    timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, ms)
  })
  const running = task(controller.signal).catch(() =>
    err(appError("unknown", "The provider failed unexpectedly")),
  )
  try {
    const result = await Promise.race([running, aborted])
    return { result, timedOut }
  } finally {
    clearTimeout(timer)
    parent?.removeEventListener("abort", stop)
  }
}

/** Waits `ms`, or less if the signal aborts first. */
export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve()
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}
