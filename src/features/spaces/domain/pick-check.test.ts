import { describe, expect, it } from "vitest"
import { checkPick } from "./pick-check"
import { DEFAULT_LOOK } from "./space-look"

describe("checkPick", () => {
  it("passes a readable button colour and says how readable", () => {
    expect(checkPick("button", "#3225A8", DEFAULT_LOOK)).toEqual({
      ratio: 9.7,
      passes: true,
      fix: null,
    })
  })

  it("offers the nearest readable button colour for a pale one", () => {
    const check = checkPick("button", "#e0a030", DEFAULT_LOOK)!
    expect(check.passes).toBe(false)
    expect(check.fix!.ratio).toBeGreaterThanOrEqual(4.5)
    expect(check.fix!.hex).toMatch(/^#[0-9a-f]{6}$/)
  })

  it("checks a surface against the text, lightening a dark one", () => {
    const check = checkPick("background", "#333333", DEFAULT_LOOK)!
    expect(check.passes).toBe(false)
    expect(check.fix!.ratio).toBeGreaterThanOrEqual(4.5)
  })

  it("ignores input that is not a colour yet", () => {
    expect(checkPick("card", "#12", DEFAULT_LOOK)).toBeNull()
  })
})
