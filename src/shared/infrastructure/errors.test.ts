import { describe, expect, it } from "vitest"
import { toAppError } from "./errors"

describe("toAppError", () => {
  it("maps postgres codes to kinds", () => {
    expect(toAppError({ code: "42501", message: "rls" }).kind).toBe("denied")
    expect(toAppError({ code: "23505", message: "dup" }).kind).toBe("conflict")
    expect(toAppError({ code: "40001", message: "stale" }).kind).toBe("conflict")
  })

  it("keeps validation messages but hides other internals", () => {
    expect(toAppError({ code: "P0001", message: "Space limit reached" }).message).toBe(
      "Space limit reached",
    )
    expect(toAppError({ code: "42501", message: "policy x on table y" }).message).not.toContain(
      "policy",
    )
  })

  it("falls back to HTTP status, and to network only for transport failures", () => {
    expect(toAppError({ status: 429 }).kind).toBe("rate_limited")
    expect(toAppError({ code: "", message: "TypeError: Failed to fetch" }).kind).toBe("network")
    expect(toAppError({ message: "FetchError: NetworkError" }).kind).toBe("network")
    expect(toAppError(null).kind).toBe("unknown")
  })

  it("never calls a server-side failure offline", () => {
    expect(toAppError({ code: "PGRST202", message: "Could not find the function" }).kind).toBe(
      "unknown",
    )
    expect(toAppError({ code: "XX000", message: "internal" }).kind).toBe("unknown")
  })

  it("asks to sign in again when the session token has expired", () => {
    expect(toAppError({ code: "PGRST301", message: "JWT expired" }).kind).toBe("unauthenticated")
    expect(toAppError({ code: "PGRST303", message: "JWT invalid" }).kind).toBe("unauthenticated")
  })

  it("shows only messages our own functions wrote, never raw constraint text", () => {
    expect(toAppError({ code: "22023", message: "Pick a window of 92 days or less" }).message).toBe(
      "Pick a window of 92 days or less",
    )
    for (const code of ["23514", "23502", "22P02", "22001"]) {
      const error = toAppError({ code, message: 'new row violates check constraint "x_check"' })
      expect(error.kind).toBe("validation")
      expect(error.message).toBe("Please check the highlighted fields")
    }
  })
})

describe("toAppError server failures", () => {
  it("treats 5xx as a retryable outage", () => {
    expect(toAppError({ status: 504 }).kind).toBe("network")
  })
})
