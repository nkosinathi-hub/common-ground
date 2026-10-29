import { describe, expect, it } from "vitest"
import { accentTokens, contrastRatio, luminance, SURFACES, type ColourMode } from "./contrast"

const MODES: ColourMode[] = ["light", "dark"]
const EXTREMES = ["#fefefe", "#ffffff", "#010101", "#000000", "#ffff00", "#00ffff", "#0000ff"]
const AA = 4.5

describe("contrast maths", () => {
  it("matches the WCAG reference values", () => {
    expect(luminance("#ffffff")).toBeCloseTo(1)
    expect(luminance("#000000")).toBe(0)
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21)
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21)
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2)
  })
})

describe("accentTokens", () => {
  for (const mode of MODES) {
    for (const accent of EXTREMES) {
      it(`keeps ${accent} readable in ${mode} mode`, () => {
        const { vars } = accentTokens(accent, mode)
        const surfaces = SURFACES[mode]
        const primary = vars["--primary"]
        expect(contrastRatio(primary, surfaces.background)).toBeGreaterThanOrEqual(AA)
        expect(contrastRatio(primary, surfaces.card)).toBeGreaterThanOrEqual(AA)
        expect(contrastRatio(primary, vars["--secondary"])).toBeGreaterThanOrEqual(AA)
        expect(contrastRatio(vars["--primary-foreground"], primary)).toBeGreaterThanOrEqual(AA)
        expect(contrastRatio(surfaces.foreground, vars["--secondary"])).toBeGreaterThanOrEqual(AA)
        expect(vars["--secondary-foreground"]).toBe(primary)
        expect(vars["--ring"]).toBe(primary)
      })
    }
  }

  it("leaves an accent that already passes alone and says so", () => {
    expect(accentTokens("#3225A8", "light")).toMatchObject({
      adjusted: false,
      vars: { "--primary": "#3225a8", "--primary-foreground": SURFACES.light.card },
    })
  })

  it("darkens in light mode and lightens in dark mode, reporting the change", () => {
    const light = accentTokens("#ffff00", "light")
    const dark = accentTokens("#000000", "dark")
    expect(light.adjusted).toBe(true)
    expect(luminance(light.vars["--primary"])).toBeLessThan(luminance("#ffff00"))
    expect(dark.adjusted).toBe(true)
    expect(dark.vars["--primary-foreground"]).toBe(SURFACES.dark.background)
  })

  it("tints the accent surfaces lightly toward the primary", () => {
    const { vars } = accentTokens("#8a4f5d", "light")
    expect(vars["--secondary"]).not.toBe(SURFACES.light.background)
    expect(contrastRatio(vars["--secondary"], SURFACES.light.background)).toBeLessThan(1.3)
  })
})
