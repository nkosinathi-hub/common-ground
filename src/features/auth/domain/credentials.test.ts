import { describe, expect, it } from "vitest"
import { validateEmail, validatePassword, validateSignUp } from "./credentials"

describe("credentials", () => {
  it("normalises email", () => {
    expect(validateEmail("  Me@Example.COM ")).toEqual({ ok: true, value: "me@example.com" })
    expect(validateEmail("nope").ok).toBe(false)
  })

  it("requires at least 10 password characters", () => {
    expect(validatePassword("short").ok).toBe(false)
    expect(validatePassword("long enough!").ok).toBe(true)
    expect(validatePassword("x".repeat(129)).ok).toBe(false)
  })

  it("validates a whole sign-up and names the failing field", () => {
    const bad = validateSignUp({ email: "a@b.co", password: "1234567890", displayName: " " })
    expect(bad.ok ? null : bad.error.field).toBe("displayName")
    const good = validateSignUp({ email: "A@b.co", password: "1234567890", displayName: " Ana " })
    expect(good).toEqual({
      ok: true,
      value: { email: "a@b.co", password: "1234567890", displayName: "Ana" },
    })
  })
})
