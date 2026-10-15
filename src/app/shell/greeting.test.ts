import { describe, expect, it } from "vitest"
import { greetingFor } from "./greeting"

describe("greetingFor", () => {
  it("follows the local hour", () => {
    expect(greetingFor(6)).toBe("Good morning")
    expect(greetingFor(12)).toBe("Good afternoon")
    expect(greetingFor(18)).toBe("Good evening")
    expect(greetingFor(23)).toBe("Good evening")
  })
})
