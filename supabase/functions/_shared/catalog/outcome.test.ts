import { describe, expect, it } from "vitest"
import { failure } from "./outcome.ts"

describe("catalog failures", () => {
  it("offer the manual fallback when TMDB is unavailable", () => {
    expect(failure("unavailable")).toEqual({
      ok: false,
      kind: "unavailable",
      status: 503,
      message: "The catalog is unavailable right now. Try again, or add the title manually",
    })
  })

  it("speak about the catalog, never about internals", () => {
    expect(failure("unauthenticated").message).toBe("Sign in to search the catalog")
    expect(failure("denied")).toMatchObject({ status: 403, message: "This space is unavailable" })
    expect(failure("not_found").status).toBe(404)
    expect(failure("rate_limited").status).toBe(429)
  })

  it("keep a specific validation reason", () => {
    expect(failure("validation", "Choose a page from 1 to 20")).toMatchObject({
      status: 400,
      message: "Choose a page from 1 to 20",
    })
  })
})
