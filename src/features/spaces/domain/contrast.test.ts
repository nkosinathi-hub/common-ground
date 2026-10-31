import { describe, expect, it } from "vitest"
import { contrastRatio, luminance, nudgeToContrast } from "./contrast"

describe("contrast maths", () => {
  it("matches the WCAG reference values", () => {
    expect(luminance("#ffffff")).toBeCloseTo(1)
    expect(luminance("#000000")).toBe(0)
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21)
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21)
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2)
  })

  it("leaves a readable colour alone and moves an unreadable one just far enough", () => {
    const white = () => ["#ffffff"]
    expect(nudgeToContrast("#3225A8", white, "darker")).toBe("#3225a8")
    const moved = nudgeToContrast("#ffee00", white, "darker")
    expect(contrastRatio(moved, "#ffffff")).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(moved, "#ffffff")).toBeLessThan(5)
  })

  it("falls back to black or white when no lightness of the hue passes", () => {
    const itself = (candidate: string) => [candidate]
    expect(nudgeToContrast("#808080", itself, "darker")).toBe("#000000")
    expect(nudgeToContrast("#808080", itself, "lighter")).toBe("#ffffff")
  })
})
