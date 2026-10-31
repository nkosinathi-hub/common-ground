import { describe, expect, it } from "vitest"
import { initialOf } from "./initials"

describe("initialOf", () => {
  it("takes the first letter, uppercased, and falls back for a blank name", () => {
    expect(initialOf("  ana")).toBe("A")
    expect(initialOf("Ében")).toBe("É")
    expect(initialOf("   ")).toBe("?")
  })
})
