import { describe, expect, it } from "vitest"
import { callbackUrl, parseAuthCallback, scrubbedUrl } from "./callback"

describe("auth callback", () => {
  it("reads a PKCE code and the next hint", () => {
    expect(parseAuthCallback("?code=abc&next=new-password", "")).toEqual({
      kind: "code",
      code: "abc",
      next: "new-password",
    })
    expect(parseAuthCallback("?code=abc", "#/")).toMatchObject({ next: "home" })
  })

  it("detects expired and invalid links in query or fragment", () => {
    expect(parseAuthCallback("?error=access_denied&error_code=otp_expired", "")).toEqual({
      kind: "error",
      reason: "expired",
    })
    expect(parseAuthCallback("", "#error=server_error")).toEqual({ kind: "error", reason: "invalid" })
  })

  it("does nothing on normal navigation", () => {
    expect(parseAuthCallback("", "#/s/x/home")).toEqual({ kind: "none" })
  })

  it("builds redirect URLs under the Pages base path", () => {
    expect(callbackUrl("https://x.github.io", "/common-ground", "home")).toBe(
      "https://x.github.io/common-ground/?next=home",
    )
    expect(callbackUrl("http://127.0.0.1:5173", "/", "new-password")).toBe(
      "http://127.0.0.1:5173/?next=new-password",
    )
  })

  it("drops token-bearing fragments when scrubbing", () => {
    expect(scrubbedUrl("/cg/", "#error=x")).toBe("/cg/")
    expect(scrubbedUrl("/cg/", "#/s/1/home")).toBe("/cg/#/s/1/home")
  })
})
