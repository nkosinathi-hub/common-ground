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

  it("falls back to HTTP status and network", () => {
    expect(toAppError({ status: 429 }).kind).toBe("rate_limited")
    expect(toAppError({ message: "Failed to fetch" }).kind).toBe("network")
    expect(toAppError(null).kind).toBe("unknown")
  })
})

describe("toAppError server failures", () => {
  it("treats 5xx as a retryable outage", () => {
    expect(toAppError({ status: 504 }).kind).toBe("network")
  })
})
