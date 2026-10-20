import { afterEach, describe, expect, it, vi } from "vitest"
import { remembered } from "./remembered"

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe("remembered", () => {
  it("keeps a yes per device, and forgets it", () => {
    const tip = remembered("notes.test")
    expect(tip.get()).toBe(false)
    tip.set(true)
    expect(tip.get()).toBe(true)
    tip.set(false)
    expect(tip.get()).toBe(false)
  })

  it("never fails when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const tip = remembered("notes.test")
    expect(tip.get()).toBe(false)
    expect(() => tip.set(true)).not.toThrow()
  })
})
