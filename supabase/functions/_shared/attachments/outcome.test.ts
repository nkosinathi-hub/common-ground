import { describe, expect, it } from "vitest"
import { failure } from "./outcome.ts"

describe("attachments failures", () => {
  it("speak about files, never about internals", () => {
    expect(failure("unavailable")).toEqual({
      ok: false,
      kind: "unavailable",
      status: 503,
      message: "Attachments are unavailable right now. Try again in a moment",
    })
    expect(failure("unauthenticated")).toMatchObject({
      status: 401,
      message: "Sign in to use attachments",
    })
    expect(failure("denied").message).toBe("You do not have access to this file")
    expect(failure("not_found").status).toBe(404)
  })

  it("carry the specific reason a file was refused", () => {
    const reason = "This file's contents do not match its type, so it was not attached"
    expect(failure("validation", reason)).toMatchObject({ status: 400, message: reason })
    expect(failure("rate_limited").status).toBe(429)
  })
})
