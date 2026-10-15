import { describe, expect, it } from "vitest"
import { isCleanupAuthorized } from "./secret.ts"

const SECRET = "s".repeat(40)
const SHORT = "s".repeat(31)

describe("isCleanupAuthorized", () => {
  it("accepts only the exact configured secret", () => {
    expect(isCleanupAuthorized(SECRET, SECRET)).toBe(true)
    expect(isCleanupAuthorized(`${SECRET}x`, SECRET)).toBe(false)
    expect(isCleanupAuthorized(SECRET.slice(1), SECRET)).toBe(false)
    expect(isCleanupAuthorized("t".repeat(40), SECRET)).toBe(false)
    expect(isCleanupAuthorized(null, SECRET)).toBe(false)
  })

  it("compares multi-byte text by its bytes", () => {
    const accented = `${"é".repeat(20)}${"s".repeat(20)}`
    expect(isCleanupAuthorized(accented, accented)).toBe(true)
    expect(isCleanupAuthorized(`${"e".repeat(20)}${"s".repeat(20)}`, accented)).toBe(false)
  })

  it("denies everything when the secret is unset or shorter than 32 characters", () => {
    expect(isCleanupAuthorized("", "")).toBe(false)
    expect(isCleanupAuthorized(SHORT, SHORT)).toBe(false)
  })
})
