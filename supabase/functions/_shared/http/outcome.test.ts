import { describe, expect, it } from "vitest"
import { failureWith, success, type ErrorKind, type FailureCopy } from "./outcome.ts"

const COPY: FailureCopy = {
  validation: "Check the request",
  unauthenticated: "Sign in",
  denied: "Not yours",
  not_found: "Gone",
  rate_limited: "Slow down",
  unavailable: "Try later",
}
const failure = failureWith(COPY)

describe("failureWith", () => {
  it.each<[ErrorKind, number]>([
    ["validation", 400],
    ["unauthenticated", 401],
    ["denied", 403],
    ["not_found", 404],
    ["rate_limited", 429],
    ["unavailable", 503],
  ])("answers %s with HTTP %i and the function's default copy", (kind, status) => {
    expect(failure(kind)).toEqual({ ok: false, kind, status, message: COPY[kind] })
  })

  it("lets a caller replace the copy with a specific reason", () => {
    expect(failure("validation", "Choose a file").message).toBe("Choose a file")
  })
})

describe("success", () => {
  it("wraps a body", () => {
    expect(success({ id: 1 })).toEqual({ ok: true, body: { id: 1 } })
  })
})
