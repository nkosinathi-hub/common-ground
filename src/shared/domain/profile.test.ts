import { describe, expect, it } from "vitest"
import { DISPLAY_NAME_MAX, MIN_PASSWORD, validateDisplayName } from "./profile"

describe("validateDisplayName", () => {
  it("trims and accepts 1 to the maximum number of characters", () => {
    expect(validateDisplayName("  Ana ")).toEqual({ ok: true, value: "Ana" })
    expect(validateDisplayName("x".repeat(DISPLAY_NAME_MAX)).ok).toBe(true)
  })

  it("rejects blank or too long names on the name field with one message", () => {
    for (const bad of ["", "   ", "x".repeat(DISPLAY_NAME_MAX + 1)]) {
      const result = validateDisplayName(bad)
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.error).toMatchObject({
          kind: "validation",
          field: "displayName",
          message: "Use 1 to 80 characters",
        })
    }
  })
})

describe("profile limits", () => {
  it("match what the auth service and profiles table enforce", () => {
    expect(DISPLAY_NAME_MAX).toBe(80)
    expect(MIN_PASSWORD).toBe(10)
  })
})
