import { appError, type AppError } from "../../../shared/domain/result"
import type { ErrorClass } from "./provider.types"

/** Retry what may pass next time, stop on what never will, and treat auth on its own. */
export function defaultClassify(error: AppError): ErrorClass {
  switch (error.kind) {
    case "network":
    case "rate_limited":
    case "unknown":
      return "transient"
    case "unauthenticated":
    case "denied":
      return "auth"
    default:
      return "permanent"
  }
}

export const timeoutError = (ms: number): AppError =>
  appError("network", `Timed out after ${ms} ms`)
